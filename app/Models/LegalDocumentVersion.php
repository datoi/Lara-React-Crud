<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * The exact text of one version of a legal document, kept the first time
 * anyone accepts it. `content` is the document's source file (both languages);
 * `sha256` is its fingerprint, which matches the file in git at that version.
 */
class LegalDocumentVersion extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['document', 'version', 'sha256', 'content'];
}
