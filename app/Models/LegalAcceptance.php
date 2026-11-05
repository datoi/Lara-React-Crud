<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * One box someone ticked (or, for marketing, left unticked), and the evidence
 * around it. Append-only: a later answer is a new row, so the record of what
 * was agreed, and when, can never be rewritten. Written only through
 * App\Support\LegalDocuments::record().
 */
class LegalAcceptance extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'document',
        'version',
        'legal_document_version_id',
        'accepted',
        'context',
        'locale',
        'ip_address',
        'user_agent',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'accepted' => 'boolean',
            'accepted_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Legal acceptances are a record and cannot be changed.'));
        static::deleting(fn () => throw new LogicException('Legal acceptances are a record and cannot be deleted.'));
    }

    public function documentVersion(): BelongsTo
    {
        return $this->belongsTo(LegalDocumentVersion::class, 'legal_document_version_id');
    }
}
