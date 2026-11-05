<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetCodeMail;
use App\Models\PasswordResetCode;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

/**
 * Forgetting a password and changing one. Admins are left out of both: start.sh
 * sets the admin password from ADMIN_PASSWORD on every deploy, so a change made
 * here would quietly be undone.
 */
class PasswordController extends Controller
{
    /** Codes one account (or one unknown login) may be sent per window. */
    private const CODES_PER_WINDOW = 3;

    private const WINDOW_SECONDS = 900;

    /**
     * POST /api/password/forgot  { login }
     *
     * Sends a six-digit code to where the person said: their email when they
     * typed an email, their phone by SMS when they typed a number. The answer
     * is the same whether or not an account exists, so this cannot be used to
     * find out who has one.
     */
    public function forgot(Request $request)
    {
        $data = $request->validate(['login' => ['required', 'string', 'max:255']]);

        $login = trim($data['login']);
        $channel = str_contains($login, '@') ? 'email' : 'phone';
        $user = User::findByLogin($login);
        if ($user && ! in_array($user->role, ['customer', 'tailor'], true)) {
            $user = null;
        }

        // Each code is an SMS Kere pays for and a message on someone's phone.
        $limiterKey = 'password-forgot:'.($user ? "user:{$user->id}" : 'login:'.sha1(Str::lower($login)));
        if (RateLimiter::tooManyAttempts($limiterKey, self::CODES_PER_WINDOW)) {
            return response()->json(['message' => 'Too many codes requested. Try again later.', 'code' => 'reset_too_many'], 429);
        }
        RateLimiter::hit($limiterKey, self::WINDOW_SECONDS);

        if (! $user) {
            return response()->json(['reset_id' => (string) Str::uuid(), 'channel' => $channel]);
        }

        $otp = (new OtpService)->generate();
        PasswordResetCode::where('user_id', $user->id)->delete();
        $record = PasswordResetCode::create([
            'user_id' => $user->id,
            'channel' => $channel,
            'code_hash' => hash('sha256', $otp),
            'expires_at' => now()->addMinutes(PasswordResetCode::LIFETIME_MINUTES),
        ]);

        try {
            if ($channel === 'email') {
                Mail::to($user->email)->send(new PasswordResetCodeMail($otp, $user->first_name ?: ''));
            } else {
                (new OtpService)->sendPasswordResetSms($user->phone, $otp);
            }
        } catch (\Throwable $e) {
            Log::error("Password reset code for user {$user->id} failed ({$channel}): ".$e->getMessage());
        }

        return response()->json(['reset_id' => $record->id, 'channel' => $channel]);
    }

    /**
     * POST /api/password/reset  { reset_id, code, password, password_confirmation }
     *
     * Sets the new password and signs the account out everywhere, so whoever
     * knew the old one is signed out too. The person then signs in with the
     * new password on the page for their role.
     */
    public function reset(Request $request)
    {
        $data = $request->validate([
            'reset_id' => ['required', 'string', 'max:64'],
            'code' => ['required', 'string', 'size:6'],
            'password' => ['required', 'confirmed', Password::min(8)->numbers()],
        ]);

        $record = PasswordResetCode::with('user')->find($data['reset_id']);

        if ($record && $record->expires_at->isPast()) {
            $record->delete();

            return response()->json(['message' => 'This code has expired. Ask for a new one.', 'code' => 'reset_expired'], 410);
        }

        if (! $record || ! $record->user || ! $record->matches($data['code'])) {
            if ($record) {
                $record->increment('attempts');
                if ($record->attempts >= PasswordResetCode::MAX_ATTEMPTS) {
                    $record->delete();

                    return response()->json(['message' => 'Too many wrong codes. Ask for a new one.', 'code' => 'reset_expired'], 410);
                }
            }

            return response()->json(['message' => 'That code is not right.', 'code' => 'reset_code_invalid'], 422);
        }

        $user = $record->user;
        $user->forceFill(['password' => $data['password'], 'api_token' => null])->save();
        PasswordResetCode::where('user_id', $user->id)->delete();
        RateLimiter::clear("password-forgot:user:{$user->id}");

        return response()->json(['role' => $user->role]);
    }

    /**
     * PATCH /api/me/password  { current_password, password, password_confirmation }
     *
     * The account stays signed in here; with one token per account there is no
     * other session to sign out.
     */
    public function change(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)->numbers()],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'The current password is not right.',
                'code' => 'current_password_wrong',
                'errors' => ['current_password' => ['current_password_wrong']],
            ], 422);
        }

        $user->forceFill(['password' => $data['password']])->save();

        return response()->json(['status' => 'password_changed']);
    }
}
