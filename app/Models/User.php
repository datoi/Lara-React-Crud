<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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

    /**
     * Whether this customer may place an order.
     *
     * Derived, not stored: a flag alongside these fields could disagree with
     * them, and the version that says "yes" while consent is missing is the one
     * that matters.
     */
    public function mayPlaceOrders(): bool
    {
        if (! $this->registrationComplete()) {
            return false;
        }

        return ! $this->needsGuardianConsent() || $this->guardian_consent_at !== null;
    }

    public function getFullName(): string
    {
        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? '')) ?: ($this->name ?? '');
    }
}
