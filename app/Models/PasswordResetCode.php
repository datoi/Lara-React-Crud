<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/** A code sent to someone who forgot their password. Only its SHA-256 hash is kept. */
class PasswordResetCode extends Model
{
    /** How long a code stays valid. The email states it, so both read this. */
    public const LIFETIME_MINUTES = 15;

    /** Wrong guesses allowed before the code is spent and a new one must be asked for. */
    public const MAX_ATTEMPTS = 5;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['user_id', 'channel', 'code_hash', 'attempts', 'expires_at'];

    protected $casts = ['expires_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(fn ($m) => $m->id ??= (string) Str::uuid());
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function matches(string $code): bool
    {
        return hash_equals($this->code_hash, hash('sha256', $code));
    }
}
