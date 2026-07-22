<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Verification;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    // ─── OTP Registration ─────────────────────────────────────────────────────

    /**
     * POST /api/register/initiate
     * Validates form data, creates a verification record, sends an OTP.
     * Customers verify by email; tailors may register without an email,
     * in which case the OTP goes to their phone via SMS.
     * Body: { first_name, last_name, email?, phone, password, password_confirmation, role }
     */
    public function registerInitiate(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'required_if:role,customer', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^\+\d{8,15}$/', 'unique:users,phone'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'role' => ['required', 'in:customer,tailor'],
        ]);

        $email = $data['email'] ?? null;
        // Tailors always verify by phone (their primary identity), even when they
        // also provide an email; customers verify by email.
        $viaSms = $email === null || $data['role'] === 'tailor';

        // Delete any previous incomplete verification for this email/phone
        if ($email) {
            Verification::where('email', $email)->delete();
        }
        Verification::where('phone', $data['phone'])->delete();

        $otp = (new OtpService)->generate();
        $record = Verification::create([
            'email' => $email,
            'phone' => $data['phone'],
            $viaSms ? 'otp_phone' : 'otp_email' => $otp,
            'registration_data' => [
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $email,
                'phone' => $data['phone'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
            ],
            'expires_at' => now()->addMinutes(30),
        ]);

        if ($viaSms) {
            try {
                (new OtpService)->sendSms($data['phone'], $otp);
            } catch (\Exception $e) {
                Log::error('OTP SMS failed: '.$e->getMessage());
            }

            return response()->json([
                'verification_id' => $record->id,
                'channel' => 'phone',
                'phone' => $this->maskPhone($data['phone']),
                'message' => 'Verification code sent to your phone.',
            ], 200);
        }

        try {
            (new OtpService)->sendEmail($email, $otp, $data['first_name']);
        } catch (\Exception $e) {
            Log::error('OTP email failed: '.$e->getMessage());
            // Don't expose the error to the client; email may still arrive
        }

        return response()->json([
            'verification_id' => $record->id,
            'channel' => 'email',
            'email' => $email,
            'message' => 'Verification code sent to your email.',
        ], 200);
    }

    /**
     * POST /api/register/verify-email
     * Validates the email OTP; on success sends SMS OTP.
     * Body: { verification_id, code }
     */
    public function registerVerifyEmail(Request $request)
    {
        $data = $request->validate([
            'verification_id' => ['required', 'string'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $record = Verification::find($data['verification_id']);

        if (! $record) {
            return response()->json(['message' => 'Session expired. Please start over.'], 410);
        }

        if ($record->isExpired()) {
            $record->delete();

            return response()->json(['message' => 'Verification code expired. Please request a new one.'], 422);
        }

        if ($record->email_attempts >= 5) {
            $record->delete();

            return response()->json(['message' => 'Too many incorrect attempts. Please register again.'], 422);
        }

        if ($record->otp_email !== $data['code']) {
            $record->increment('email_attempts');
            if ($record->email_attempts >= 5) {
                $record->delete();

                return response()->json(['message' => 'Too many incorrect attempts. Please register again.'], 422);
            }

            return response()->json(['message' => 'Incorrect code. Please try again.'], 422);
        }

        // Email verified — create the user immediately
        $reg = $record->registration_data;
        $token = Str::random(60);

        $user = User::create([
            'first_name' => $reg['first_name'],
            'last_name' => $reg['last_name'],
            'name' => $reg['first_name'].' '.$reg['last_name'],
            'email' => $reg['email'],
            'phone' => $reg['phone'],
            'role' => $reg['role'],
            'password' => $reg['password'], // already hashed
            'api_token' => hash('sha256', $token),
            'approval_status' => $reg['role'] === 'tailor' ? 'pending' : null,
        ]);

        $record->delete();

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'approval_status' => $user->approval_status,
            ],
        ], 200);
    }

    /**
     * POST /api/register/verify-phone
     * Validates the SMS OTP; on success creates the user and returns a token.
     * Body: { verification_id, code }
     */
    public function registerVerifyPhone(Request $request)
    {
        $data = $request->validate([
            'verification_id' => ['required', 'string'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $record = Verification::find($data['verification_id']);

        if (! $record || $record->isExpired()) {
            return response()->json(['message' => 'Session expired. Please start over.'], 410);
        }

        if ($record->email && ! $record->email_verified_at) {
            return response()->json(['message' => 'Email not yet verified.'], 422);
        }

        if ($record->phone_attempts >= 5) {
            $record->delete();

            return response()->json(['message' => 'Too many incorrect attempts. Please register again.'], 422);
        }

        if ($record->otp_phone !== $data['code']) {
            $record->increment('phone_attempts');
            if ($record->phone_attempts >= 5) {
                $record->delete();

                return response()->json(['message' => 'Too many incorrect attempts. Please register again.'], 422);
            }

            return response()->json(['message' => 'Incorrect code. Please try again.'], 422);
        }

        // Create the user
        $reg = $record->registration_data;
        $token = Str::random(60);

        $user = User::create([
            'first_name' => $reg['first_name'],
            'last_name' => $reg['last_name'],
            'name' => $reg['first_name'].' '.$reg['last_name'],
            'email' => $reg['email'],
            'phone' => $reg['phone'],
            'role' => $reg['role'],
            'password' => $reg['password'], // already hashed
            'api_token' => hash('sha256', $token),
            'approval_status' => $reg['role'] === 'tailor' ? 'pending' : null,
        ]);

        $record->delete();

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'approval_status' => $user->approval_status,
            ],
        ], 201);
    }

    /**
     * POST /api/register/resend
     * Resend the OTP for email or phone. Max 3 resends per type per session.
     * Body: { verification_id, type: "email"|"phone" }
     */
    public function registerResend(Request $request)
    {
        $data = $request->validate([
            'verification_id' => ['required', 'string'],
            'type' => ['required', 'in:email,phone'],
        ]);

        $record = Verification::find($data['verification_id']);

        if (! $record || $record->isExpired()) {
            return response()->json(['message' => 'Session expired. Please start over.'], 410);
        }

        $countField = "otp_{$data['type']}_resend_count";
        // Map to actual column names
        $resendCountCol = $data['type'] === 'email' ? 'email_resend_count' : 'phone_resend_count';

        if ($record->$resendCountCol >= 3) {
            return response()->json(['message' => 'Maximum resend attempts reached. Please start registration again.'], 429);
        }

        $otp = (new OtpService)->generate();
        $service = new OtpService;
        $reg = $record->registration_data;

        if ($data['type'] === 'email') {
            if (! $record->email) {
                return response()->json(['message' => 'This registration has no email.'], 422);
            }
            $record->update([
                'otp_email' => $otp,
                'email_attempts' => 0,
                'email_resend_count' => $record->email_resend_count + 1,
            ]);
            try {
                $service->sendEmail($record->email, $otp, $reg['first_name'] ?? 'there');
            } catch (\Exception $e) {
                Log::error('OTP resend email failed: '.$e->getMessage());
            }
        } else {
            if ($record->email && ! $record->email_verified_at) {
                return response()->json(['message' => 'Verify your email first.'], 422);
            }
            $record->update(['otp_phone' => $otp, 'phone_resend_count' => $record->phone_resend_count + 1]);
            try {
                $service->sendSms($record->phone, $otp);
            } catch (\Exception $e) {
                Log::error('OTP resend SMS failed: '.$e->getMessage());
            }
        }

        return response()->json(['message' => 'New code sent.'], 200);
    }

    // ─── Admin login ──────────────────────────────────────────────────────────

    /**
     * POST /api/admin/auth
     */
    public function adminLogin(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])
            ->where('role', 'admin')
            ->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if ($user->is_suspended) {
            return response()->json(['message' => 'This account has been suspended.'], 403);
        }

        $token = Str::random(60);
        $user->update(['api_token' => hash('sha256', $token)]);

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
            ],
        ]);
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    /**
     * POST /api/login
     * `login` accepts either an email address or a phone number.
     */
    public function login(Request $request)
    {
        if (! $request->filled('login') && $request->filled('email')) {
            $request->merge(['login' => $request->input('email')]);
        }

        $data = $request->validate([
            'login' => ['required', 'string', 'max:255'],
            'password' => ['required'],
            'role' => ['required', 'in:customer,tailor,admin'],
        ]);

        $user = $this->findByLogin($data['login']);

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if ($user->is_suspended) {
            return response()->json(['message' => 'This account has been suspended.'], 403);
        }

        if ($user->role !== 'admin' && $user->role !== $data['role']) {
            $expected = ucfirst($data['role']);

            return response()->json([
                'message' => "Access denied. This account is not registered as a {$expected}.",
            ], 403);
        }

        $token = Str::random(60);
        $user->update(['api_token' => hash('sha256', $token)]);

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'approval_status' => $user->approval_status,
            ],
        ]);
    }

    // ─── Current user ─────────────────────────────────────────────────────────

    /**
     * GET /api/me
     * Returns the authenticated user's fresh data — used to detect changes
     * (e.g. tailor approval status) without requiring a re-login.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'approval_status' => $user->approval_status,
            ],
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Find a user by email or phone number (tolerant of spacing and missing +995 prefix). */
    private function findByLogin(string $login): ?User
    {
        $login = trim($login);

        if (str_contains($login, '@')) {
            return User::where('email', $login)->first();
        }

        $digits = preg_replace('/\D+/', '', $login);
        if ($digits === '') {
            return null;
        }

        $candidates = [$login, '+'.$digits];
        if (strlen($digits) === 9) {
            $candidates[] = '+995'.$digits; // local Georgian number without country code
        }

        return User::whereIn('phone', array_unique($candidates))->first();
    }

    private function maskPhone(string $phone): string
    {
        // Show last 4 digits: e.g. "+995 555 *** 1234" → "**1234"
        $stripped = preg_replace('/\D/', '', $phone);
        $len = strlen($stripped);
        if ($len <= 4) {
            return $phone;
        }

        return str_repeat('*', $len - 4).substr($stripped, -4);
    }
}
