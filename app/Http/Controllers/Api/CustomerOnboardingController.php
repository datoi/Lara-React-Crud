<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\GuardianConsentRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * The part of signing up that happens after the one-time code.
 *
 * The account exists by then — verifying the code is what creates it — so date
 * of birth and the terms are answered against a real, authenticated user rather
 * than carried through the verification record. Until both are answered the
 * account is not finished, and User::mayPlaceOrders() is what enforces that.
 *
 * A customer of sixteen or seventeen additionally needs an adult to confirm.
 * They get a link by email carrying a token we keep only as a hash; consenting
 * is a public route, because a guardian has no account here and should not need
 * one to answer a question about their own child.
 */
class CustomerOnboardingController extends Controller
{
    // ─── POST /api/register/profile ───────────────────────────────────────────

    /**
     * Record date of birth, guardian details where the age calls for them, and
     * the terms. This is the step that finishes a registration.
     */
    public function completeProfile(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'customer') {
            return response()->json(['message' => 'Only customers complete this step.', 'code' => 'not_a_customer'], 403);
        }

        if ($user->registrationComplete()) {
            return response()->json(['message' => 'This account is already set up.', 'code' => 'already_complete'], 409);
        }

        $data = $request->validate([
            // Asked as three fields and sent as one date. 'before:today' keeps
            // out the birthday that has not happened yet; the age floor is
            // checked below so it can answer with a reason rather than a rule.
            'date_of_birth' => ['required', 'date', 'before:today'],
            'accept_terms' => ['accepted'],
            'accept_privacy' => ['accepted'],
            'marketing_opt_in' => ['nullable', 'boolean'],
        ], [
            'date_of_birth.before' => 'date_of_birth_invalid',
        ]);

        $birthDate = Carbon::parse($data['date_of_birth'])->startOfDay();
        // Counted where the customer is, not in the app's UTC — see
        // User::AGE_TIMEZONE for the birthday this would otherwise get wrong.
        $age = User::ageOn($birthDate->toDateString());

        if ($age < User::MINIMUM_AGE) {
            return response()->json([
                'message' => 'You must be at least '.User::MINIMUM_AGE.' to use Kere.',
                'code' => 'below_minimum_age',
            ], 422);
        }

        $needsGuardian = $age < User::ADULT_AGE;

        // The guardian block is required exactly when the age says so, and is
        // refused otherwise — an adult has no reason to be filing someone else's
        // contact details against their own account.
        $guardian = $needsGuardian
            ? $request->validate([
                'guardian_name' => ['required', 'string', 'max:150'],
                // Not the child's own contact details. Email consent is never
                // airtight, but a link sent to the account asking for it is not
                // consent at all — it is a minor ticking their own box. This
                // raises it from "retype your address" to "obtain another one",
                // which is the floor such a control is worth having at all.
                'guardian_email' => ['required', 'email', 'max:255', Rule::notIn(array_filter([$user->email]))],
                'guardian_phone' => ['required', 'string', 'max:30', 'regex:/^\+\d{8,15}$/', Rule::notIn(array_filter([$user->phone]))],
                'guardian_relationship' => ['required', Rule::in(['parent', 'legal_guardian'])],
            ], [
                'guardian_email.not_in' => 'guardian_contact_is_own',
                'guardian_phone.not_in' => 'guardian_contact_is_own',
            ])
            : [];

        $user->fill([
            'date_of_birth' => $birthDate->toDateString(),
            'marketing_opt_in' => (bool) ($data['marketing_opt_in'] ?? false),
            'terms_accepted_at' => now(),
        ] + $guardian);

        $user->save();

        if ($needsGuardian) {
            $this->issueConsentLink($user);
        }

        return response()->json([
            'registration_complete' => true,
            'needs_guardian_consent' => $needsGuardian,
            'guardian_email' => $needsGuardian ? $user->guardian_email : null,
            'may_place_orders' => $user->mayPlaceOrders(),
        ]);
    }

    // ─── POST /api/register/guardian-consent/resend ───────────────────────────

    /**
     * Send the consent link again, optionally to a corrected address.
     *
     * Without this a guardian who never received the first email leaves the
     * account stuck with no way out — and a mistyped address is the likeliest
     * reason the first one went nowhere, so changing it is part of asking again.
     */
    public function resendConsent(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'customer' || ! $user->needsGuardianConsent()) {
            return response()->json(['message' => 'Nothing to confirm.', 'code' => 'consent_not_required'], 422);
        }

        if ($user->guardian_consent_at !== null) {
            return response()->json(['message' => 'Consent has already been given.', 'code' => 'consent_already_given'], 409);
        }

        // Correcting the address must not become a way around the check the
        // first submission made: without this, a minor simply resends to
        // themselves.
        $data = $request->validate([
            'guardian_email' => ['nullable', 'email', 'max:255', Rule::notIn(array_filter([$user->email]))],
        ], [
            'guardian_email.not_in' => 'guardian_contact_is_own',
        ]);

        if (! empty($data['guardian_email'])) {
            $user->forceFill(['guardian_email' => $data['guardian_email']])->save();
        }

        $this->issueConsentLink($user);

        return response()->json(['sent' => true, 'guardian_email' => $user->guardian_email]);
    }

    // ─── GET /api/guardian-consent/{token} ────────────────────────────────────

    /**
     * What the guardian is being asked to agree to. Public, and deliberately
     * sparse: enough for an adult to recognise the child, and nothing that would
     * make a guessed token worth anything.
     */
    public function showConsent(string $token)
    {
        $user = $this->pendingConsentUser($token);

        if (! $user) {
            return response()->json(['message' => 'This link is not valid.', 'code' => 'consent_link_invalid'], 404);
        }

        return response()->json([
            'customer_name' => $user->getFullName(),
            'guardian_name' => $user->guardian_name,
            'relationship' => $user->guardian_relationship,
        ]);
    }

    // ─── POST /api/guardian-consent/{token} ───────────────────────────────────

    public function recordConsent(string $token)
    {
        $user = $this->pendingConsentUser($token);

        if (! $user) {
            return response()->json(['message' => 'This link is not valid.', 'code' => 'consent_link_invalid'], 404);
        }

        // The token is spent here: consent is given once, and a link that stays
        // live after it has been used is a link that can be replayed.
        $user->forceFill([
            'guardian_consent_at' => now(),
            'guardian_consent_token' => null,
        ])->save();

        return response()->json(['consented' => true, 'customer_name' => $user->getFullName()]);
    }

    /**
     * The account a consent token belongs to, or null.
     *
     * Matches on the hash, so the raw token is never compared against anything
     * stored. An account that has already consented has no token left and so
     * cannot be found here at all.
     */
    private function pendingConsentUser(string $token): ?User
    {
        if ($token === '') {
            return null;
        }

        return User::where('guardian_consent_token', hash('sha256', $token))
            ->whereNull('guardian_consent_at')
            ->first();
    }

    /**
     * Mint a consent link and email it to the guardian.
     *
     * Each call replaces whatever token came before, so asking for the link
     * again retires the one that went missing rather than leaving two live
     * links to the same account.
     *
     * The email is allowed to fail. The account is restricted either way, so a
     * dead mail server delays the customer rather than letting them through,
     * and the resend endpoint is how they recover.
     */
    private function issueConsentLink(User $user): void
    {
        $token = Str::random(64);

        $user->forceFill(['guardian_consent_token' => hash('sha256', $token)])->save();

        $url = rtrim(config('app.url'), '/').'/guardian-consent/'.$token;

        try {
            Mail::to($user->guardian_email)->send(new GuardianConsentRequest($user, $url));
        } catch (\Throwable $e) {
            Log::error("Guardian consent email failed for user {$user->id}: ".$e->getMessage());
        }
    }
}
