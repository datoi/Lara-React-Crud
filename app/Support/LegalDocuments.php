<?php

namespace App\Support;

use App\Models\LegalAcceptance;
use App\Models\LegalDocumentVersion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * The legal documents people agree to, and the record that they did.
 *
 * Version numbers live in resources/js/data/legalVersions.json, which the terms
 * and privacy pages read as well, so the version a page shows and the version
 * an acceptance records cannot disagree. Raise a number there when a document
 * changes enough that people must agree again: everyone who accepted an older
 * one is asked on their next visit, and a customer cannot order until they have.
 *
 * Each acceptance also names the exact text. The document's source file, both
 * languages, is fingerprinted and kept in legal_document_versions the first time
 * it is needed, so a dispute can show the words and not only a number.
 */
final class LegalDocuments
{
    /** Documents with a published text, and the file that text lives in. */
    private const SOURCES = [
        'terms' => 'js/data/termsOfService.ts',
        'privacy' => 'js/data/privacyPolicy.ts',
    ];

    /**
     * Boxes recorded without a document behind them: the marketing choice, the
     * tailor's partnership terms (no such text is published yet) and the
     * tailor's declaration that their answers are true.
     */
    private const UNVERSIONED = ['marketing', 'partnership_terms', 'information_correct'];

    /** What each role must have accepted, at the current version, to carry on. */
    private const REQUIRED = [
        'customer' => ['terms', 'privacy'],
        'tailor' => ['privacy'],
    ];

    private static ?array $versions = null;

    public static function version(string $document): string
    {
        self::$versions ??= json_decode(
            file_get_contents(resource_path('js/data/legalVersions.json')),
            true,
            flags: JSON_THROW_ON_ERROR,
        );

        return self::$versions[$document] ?? throw new InvalidArgumentException("No version for legal document {$document}.");
    }

    /** The current version of a document, with its exact text kept the first time it is asked for. */
    public static function current(string $document): LegalDocumentVersion
    {
        $source = self::SOURCES[$document] ?? throw new InvalidArgumentException("No text for legal document {$document}.");
        // Line endings normalised, so a Windows checkout fingerprints the same text as the server.
        $content = str_replace("\r\n", "\n", file_get_contents(resource_path($source)));

        return LegalDocumentVersion::firstOrCreate(
            ['document' => $document, 'version' => self::version($document), 'sha256' => hash('sha256', $content)],
            ['content' => $content],
        );
    }

    /** @return list<string> */
    public static function requiredFor(User $user): array
    {
        return self::REQUIRED[$user->role] ?? [];
    }

    /**
     * What this person must still accept: every required document they have not
     * accepted at its current version. Someone who accepted nothing on record
     * (an account from before this log) is asked for everything.
     *
     * @return list<array{document: string, version: string}>
     */
    public static function pendingFor(User $user): array
    {
        $required = self::requiredFor($user);

        // A customer who has not finished signing up answers these on the sign-up page.
        if ($required === [] || ! $user->registrationComplete()) {
            return [];
        }

        $accepted = LegalAcceptance::where('user_id', $user->id)
            ->where('accepted', true)
            ->whereIn('document', $required)
            ->get(['document', 'version'])
            ->filter(fn (LegalAcceptance $row) => $row->version === self::version($row->document))
            ->pluck('document')
            ->all();

        return collect($required)
            ->reject(fn (string $document) => in_array($document, $accepted, true))
            ->map(fn (string $document) => ['document' => $document, 'version' => self::version($document)])
            ->values()
            ->all();
    }

    /**
     * Where, when and in which language a box was ticked. Kept with the
     * registration while a tailor waits for their code, so the record carries
     * the moment of ticking rather than the moment the account was created.
     *
     * @return array{at: string, ip: ?string, user_agent: ?string, locale: ?string}
     */
    public static function evidenceFrom(Request $request, ?string $locale): array
    {
        return [
            'at' => now()->toIso8601String(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent() === null ? null : Str::limit($request->userAgent(), 509),
            'locale' => $locale,
        ];
    }

    /**
     * Record what someone answered: $answers maps each document to whether they
     * agreed. Only the marketing box may be false; every other box had to be
     * ticked for the form to go through.
     *
     * @param  array<string, bool>  $answers
     * @param  array{at?: ?string, ip?: ?string, user_agent?: ?string, locale?: ?string}  $evidence
     */
    public static function record(User $user, array $answers, string $context, array $evidence): void
    {
        $at = isset($evidence['at']) ? Carbon::parse($evidence['at']) : now();

        foreach ($answers as $document => $accepted) {
            $versioned = isset(self::SOURCES[$document]);

            if (! $versioned && ! in_array($document, self::UNVERSIONED, true)) {
                throw new InvalidArgumentException("Unknown legal document {$document}.");
            }

            $text = $versioned ? self::current($document) : null;

            LegalAcceptance::create([
                'user_id' => $user->id,
                'document' => $document,
                'version' => $text?->version,
                'legal_document_version_id' => $text?->id,
                'accepted' => $accepted,
                'context' => $context,
                'locale' => $evidence['locale'] ?? null,
                'ip_address' => $evidence['ip'] ?? null,
                'user_agent' => $evidence['user_agent'] ?? null,
                'accepted_at' => $at,
            ]);
        }
    }
}
