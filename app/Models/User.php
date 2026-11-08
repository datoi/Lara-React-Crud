<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\LegalDocuments;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'name',
        'email',
        'phone',
        'role',
        'api_token',
        'password',
        'bio',
        'specialty',
        'years_experience',
        'profile_image',
        'is_suspended',
        'is_available',
        'turnaround_days',
        'approval_status',
        'business_type',
        'does_remodeling',
        'work_preferences',
        'does_new_garments',
        'measurements',
        'workspace_address',
        'legal_status',
        'national_id',
        'id_document_path',
        'terms_accepted_at',
        'date_of_birth',
        'marketing_opt_in',
        'guardian_name',
        'guardian_email',
        'guardian_phone',
        'guardian_relationship',
        'guardian_consent_at',
    ];

    /**
     * The youngest we accept at all, and the age below which a guardian must
     * consent. Mirrored in resources/js/components/CustomerProfileSteps.tsx,
     * which decides whether to show the guardian fields — the server is what
     * enforces them, so the copy there only has to agree, not be trusted.
     */
    public const MINIMUM_AGE = 16;

    public const ADULT_AGE = 18;

    /**
     * The calendar a birthday is counted against.
     *
     * Not the app timezone, which is UTC: between midnight and 04:00 in Georgia
     * the UTC date is still yesterday, so someone turning eighteen in that
     * window is eighteen to their own calendar and seventeen to the server's —
     * and would be asked for a guardian on their birthday. Ages are answered
     * where the customer is.
     */
    public const AGE_TIMEZONE = 'Asia/Tbilisi';

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'api_token',
        // Collected for Kere's own verification, never for display. The tailor
        // endpoints build explicit allowlists, so this is the second lock: a
        // future `return $user` cannot leak an identity document or its number.
        'national_id',
        'id_document_path',
        // The raw token is emailed once and never read back; only its hash lives
        // here, and nothing has any reason to serialize even that.
        'guardian_consent_token',
        // Body measurements are personal data. Only the customer's own endpoint
        // reads them; an order carries its own snapshot for the tailor.
        'measurements',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_suspended'    => 'boolean',
            'is_available'    => 'boolean',
            'does_remodeling' => 'boolean',
            'work_preferences' => 'array',
            'does_new_garments' => 'boolean',
            'measurements'    => 'array',
            'approval_status' => 'string',
            'date_of_birth'       => 'date',
            'marketing_opt_in'    => 'boolean',
            'terms_accepted_at'   => 'datetime',
            'guardian_consent_at' => 'datetime',
        ];
    }

    /** Age in whole years today, or null when no date of birth is recorded. */
    public function age(): ?int
    {
        return self::ageOn($this->date_of_birth?->toDateString());
    }

    /** Whole years between a Y-m-d birthday and today, counted in AGE_TIMEZONE. */
    public static function ageOn(?string $birthDate): ?int
    {
        if (! $birthDate) {
            return null;
        }

        // Floored, not rounded: Carbon returns a fractional year here, and
        // rounding would make someone seventeen and eleven months an adult.
        return (int) floor(
            Carbon::parse($birthDate, self::AGE_TIMEZONE)
                ->startOfDay()
                ->diffInYears(Carbon::now(self::AGE_TIMEZONE)->startOfDay())
        );
    }

    /**
     * Whether this account needs an adult to consent before it can be used.
     *
     * True only between MINIMUM_AGE and ADULT_AGE: younger than that is refused
     * at registration and never becomes an account, older needs nobody.
     */
    public function needsGuardianConsent(): bool
    {
        $age = $this->age();

        return $age !== null && $age >= self::MINIMUM_AGE && $age < self::ADULT_AGE;
    }

    /**
     * Whether registration actually finished.
     *
     * The account is created the moment the one-time code checks out, which is
     * before date of birth and the terms are asked for. Anyone who closes the
     * tab at that point has an account that exists and has agreed to nothing,
     * so "signed up" is read from the answers rather than from the row existing.
     *
     * Only `terms_accepted_at` is checked, and not also the date of birth,
     * because of the customers who registered before either was asked for. A
     * migration backfilled their acceptance — they did agree to the terms of the
     * day — but nobody knows their birthday, and requiring one would have locked
     * every existing account out of ordering overnight. The two are written
     * together for anyone registering now, so the single check is exact for them.
     */
    public function registrationComplete(): bool
    {
        if ($this->role !== 'customer') {
            return true;
        }

        return $this->terms_accepted_at !== null;
    }

    /** Why a customer may not order, by the code the API answers with. */
    public const ORDER_REFUSALS = [
        'registration_incomplete' => 'Please finish setting up your account first.',
        'guardian_consent_pending' => 'This account is waiting for a parent or guardian to confirm.',
        'legal_acceptance_required' => 'Please read and accept the current terms first.',
    ];

    /**
     * Why this customer may not place an order now (a key of ORDER_REFUSALS),
     * or null when they may.
     *
     * Derived, not stored: a flag alongside these fields could disagree with
     * them, and the version that says "yes" while consent is missing is the one
     * that matters. An order is a contract under the terms in force, so terms
     * that changed since the customer last agreed are accepted first.
     */
    public function orderRefusal(): ?string
    {
        if (! $this->registrationComplete()) {
            return 'registration_incomplete';
        }

        if ($this->needsGuardianConsent() && $this->guardian_consent_at === null) {
            return 'guardian_consent_pending';
        }

        if (LegalDocuments::pendingFor($this) !== []) {
            return 'legal_acceptance_required';
        }

        return null;
    }

    public function mayPlaceOrders(): bool
    {
        return $this->orderRefusal() === null;
    }

    /** Whether Kere can give this tailor work: approved (or from before approval existed) and not suspended. */
    public function canTakeWork(): bool
    {
        return $this->role === 'tailor'
            && (! $this->approval_status || $this->approval_status === 'approved')
            && ! $this->is_suspended;
    }

    /** canTakeWork() as a query. */
    public function scopeAbleToTakeWork(Builder $query): Builder
    {
        return $query->where('role', 'tailor')
            ->where(fn (Builder $q) => $q->whereNull('approval_status')->orWhere('approval_status', 'approved'))
            ->where(fn (Builder $q) => $q->whereNull('is_suspended')->orWhere('is_suspended', false));
    }

    public function getFullName(): string
    {
        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? '')) ?: ($this->name ?? '');
    }

    public function wishlistProducts(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'wishlist_items')->withTimestamps();
    }

    /**
     * Accounts with this email, whatever its letter case. Phones capitalise the
     * first letter people type, and PostgreSQL compares case-sensitively, so
     * "Nino@gmail.com" at sign-up and "nino@gmail.com" at sign-in are one
     * address. New addresses are stored lower-case; older ones may not be.
     */
    public static function whereEmail(string $email): Builder
    {
        return self::query()->whereRaw('LOWER(email) = ?', [mb_strtolower(trim($email))]);
    }

    /** The account an email or phone number signs in as (tolerant of spacing, letter case and a missing +995). */
    public static function findByLogin(string $login): ?self
    {
        $login = trim($login);

        if (str_contains($login, '@')) {
            return self::whereEmail($login)->first();
        }

        $digits = preg_replace('/\D+/', '', $login);
        if ($digits === '') {
            return null;
        }

        $candidates = [$login, '+'.$digits];
        if (strlen($digits) === 9) {
            $candidates[] = '+995'.$digits; // local Georgian number without country code
        }

        return self::whereIn('phone', array_unique($candidates))->first();
    }

    /**
     * The account a sign-in attempt names, so the sign-in rate limit counts
     * its email, its phone and every spelling of them against one bucket.
     * A login that matches no account is keyed by its normalised text.
     */
    public static function loginThrottleKey(string $login): string
    {
        $user = self::findByLogin($login);
        if ($user) {
            return 'user:'.$user->id;
        }

        $login = trim($login);
        if (str_contains($login, '@')) {
            return 'email:'.mb_strtolower($login);
        }

        $digits = preg_replace('/\D+/', '', $login);

        return 'phone:'.(strlen($digits) === 9 ? '995'.$digits : $digits);
    }
}
