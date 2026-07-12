<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Verification extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'email',
        'phone',
        'otp_email',
        'otp_phone',
        'email_verified_at',
        'phone_verified_at',
        'registration_data',
        'email_resend_count',
        'phone_resend_count',
        'email_attempts',
        'phone_attempts',
        'expires_at',
    ];

    protected $casts = [
        'registration_data' => 'array',
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn ($m) => $m->id ??= (string) Str::uuid());
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
