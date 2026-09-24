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
     * Registration asks how long someone has been sewing as a band, because
     * nobody answers "7" to that question — but the profile stores a number,
     * and has since before this form existed. Each band becomes the lower bound
     * of its range, which reads correctly on the profile, keeps a single source
     * of truth, and maps back to the band it came from. A tailor who wants to
     * be exact can set the number itself in their profile afterwards.
     */
    private const EXPERIENCE_YEARS = [
        'under_1' => 0,
        '1_3'     => 1,
        '3_5'     => 3,
        '5_10'    => 5,
        'over_10' => 10,
    ];

    /**
     * The user a completed verification becomes.
     *
     * Both verification paths — email and phone — end here, so the tailor
     * fields cannot be applied on one and forgotten on the other. Anything
     * the customer flow never collects is simply absent from $reg and stays
     * null, which is why the tailor keys are spread rather than listed.
     */
    private static function attributesFor(array $reg, string $token): array
    {
        $isTailor = $reg['role'] === 'tailor';

        return array_merge([
            'first_name' => $reg['first_name'],
            'last_name' => $reg['last_name'],
            'name' => $reg['first_name'].' '.$reg['last_name'],
            'email' => $reg['email'],
            'phone' => $reg['phone'],
            'role' => $reg['role'],
            'password' => $reg['password'], // already hashed
            'api_token' => hash('sha256', $token),
            'approval_status' => $isTailor ? 'pending' : null,
        ], $isTailor ? [
            'business_type' => $reg['business_type'] ?? null,
            'workspace_address' => $reg['workspace_address'] ?? null,
            'years_experience' => $reg['years_experience'] ?? null,
            'legal_status' => $reg['legal_status'] ?? null,
            'national_id' => $reg['national_id'] ?? null,
            // The three consent boxes were mandatory to submit the form, so
            // reaching here at all is the acceptance this timestamps.
            'terms_accepted_at' => now(),
        ] : []);
    }

    // ─── POST /api/register/availability ──────────────────────────────────────

    /**
     * Whether an email or phone is already registered.
     *
     * So a multi-page form can answer that question on the page that asks it.
     * Without this the only thing that knows is the final submit, and someone
     * whose phone is already taken fills in three pages before being sent back
     * to the first to be told — which reads as the form losing their work.
     *
     * It reveals nothing the form does not already reveal: registration says
     * "this phone is already registered" either way. Throttled all the same,
     * because answering it in bulk is how a list gets tested against.
     */
    public function availability(Request $request)
    {
        $data = $request->validate([
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        return response()->json([
            'email_taken' => ! empty($data['email'])
                && User::where('email', $data['email'])->exists(),
            'phone_taken' => ! empty($data['phone'])
                && User::where('phone', $data['phone'])->exists(),
        ]);
    }

    /**
     * POST /api/register/initiate
     * Validates form data, creates a verification record, sends an OTP.
     * Tailors always verify by SMS. Customers give both an email and a phone
     * and choose which one receives the code; either way, everything after
     * registration reaches a customer by email, so the phone is only ever
     * used for this one code.
     * Body: { first_name, last_name, email?, phone, password, password_confirmation, role, verify_via? }
     * Tailors additionally send business_type, workspace_address, experience_band,
     * legal_status, national_id and the three consent boxes.
     */
    public function registerInitiate(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'required_if:role,customer', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^\+\d{8,15}$/', 'unique:users,phone'],
            // A digit as well as the length — checked here too, because the form
            // is not the only thing that can post to this endpoint.
            'password' => ['required', 'confirmed', Password::min(8)->numbers()],
            'role' => ['required', 'in:customer,tailor'],
            'verify_via' => ['exclude_unless:role,customer', 'required', 'in:email,phone'],

            // Tailors answer for their trade as well as themselves. Every rule
            // is required_if so a customer signing up is unaffected, and the
            // values are constrained here rather than trusted from the form.
            'business_type' => ['required_if:role,tailor', 'nullable', 'in:independent,atelier,workshop,designer'],
            'workspace_address' => ['required_if:role,tailor', 'nullable', 'string', 'max:255'],
            // The band the form offers, stored as the lower bound of its range
            // in the years_experience column that already exists.
            'experience_band' => ['required_if:role,tailor', 'nullable', 'in:under_1,1_3,3_5,5_10,over_10'],
            'legal_status' => ['required_if:role,tailor', 'nullable', 'in:individual,sole_trader,llc,other'],
            'national_id' => ['required_if:role,tailor', 'nullable', 'string', 'max:50'],
            // One box per consent in the form; all three must be ticked, and the
            // three together are what terms_accepted_at records.
            //
            // exclude_unless, not required_if + nullable: 'accepted' rejects a
            // null rather than skipping it, so a customer — who is never shown
            // these boxes and sends nothing — would fail all three. Excluding
            // them outside the tailor role takes them out of validation
            // entirely instead of validating an absence.
            'accept_partnership_terms' => ['exclude_unless:role,tailor', 'accepted'],
            'accept_data_processing' => ['exclude_unless:role,tailor', 'accepted'],
            'confirm_information_correct' => ['exclude_unless:role,tailor', 'accepted'],
        ], [
            // The two failures a careful person still hits — the form cannot know
            // a phone is taken until it asks. Laravel's own wording is English
            // and the interface is Georgian, so these answer with a code the
            // client translates instead of a sentence it would have to print.
            'phone.unique' => 'phone_taken',
            'email.unique' => 'email_taken',
        ]);

        $email = $data['email'] ?? null;
        // Tailors always verify by phone (their primary identity), even when they
        // also provide an email; customers verify by whichever they chose.
        $viaSms = $data['role'] === 'tailor' || $data['verify_via'] === 'phone';

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
            'registration_data' => array_merge([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $email,
                'phone' => $data['phone'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
            ], $data['role'] === 'tailor' ? [
                'business_type' => $data['business_type'],
                'workspace_address' => $data['workspace_address'],
                'years_experience' => self::EXPERIENCE_YEARS[$data['experience_band']],
                'legal_status' => $data['legal_status'],
                'national_id' => $data['national_id'],
            ] : []),
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

        $user = User::create(self::attributesFor($reg, $token));

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

        $user = User::create(self::attributesFor($reg, $token));

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

        // A code is only ever resent where the first one went — registration
        // chose the channel, and resend must not be a way to switch it.
        if ($record->{"otp_{$data['type']}"} === null) {
            return response()->json(['message' => 'This registration is not verified that way.'], 422);
        }

        $resendCountCol = $data['type'] === 'email' ? 'email_resend_count' : 'phone_resend_count';

        if ($record->$resendCountCol >= 3) {
            return response()->json(['message' => 'Maximum resend attempts reached. Please start registration again.'], 429);
        }

        $otp = (new OtpService)->generate();
        $service = new OtpService;
        $reg = $record->registration_data;

        if ($data['type'] === 'email') {
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
            $record->update([
                'otp_phone' => $otp,
                'phone_attempts' => 0,
                'phone_resend_count' => $record->phone_resend_count + 1,
            ]);
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
                // What the account may do, rather than the fields it was worked
                // out from: the customer needs to be told they are waiting and
                // on whom, not handed their own date of birth back.
                'may_place_orders' => $user->mayPlaceOrders(),
                'registration_complete' => $user->registrationComplete(),
                'guardian_consent_pending' => $user->needsGuardianConsent() && $user->guardian_consent_at === null,
                'guardian_email' => $user->needsGuardianConsent() ? $user->guardian_email : null,
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
