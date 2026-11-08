<?php

namespace App\Support;

use Illuminate\Validation\Rule;

/**
 * What a tailor wants to work on: the questionnaire asked on registration and
 * in the dashboard (the CEO's request, 2026-11-08). The choices live in
 * resources/js/data/tailorWork.json, shared with the form.
 *
 * Stored on users.work_preferences as:
 *   remodel_none      bool      "I don't take remodel orders"
 *   remodel_types     string[]  the remodel work they take (empty when none)
 *   remodel_other     ?string   remodel work not in the list
 *   new_garments      yes | not_now | no
 *   garment_types     string[]  only when new_garments is yes
 *   garment_other     ?string   only when new_garments is yes
 *   complexity        ?string   only when new_garments is yes
 *   work_notes        ?string   work they especially want, or refuse
 *   platform_feedback ?string   what would make Kere easier to work with
 *
 * Two answers decide what reaches them: remodel requests unless they take no
 * remodel work (users.does_remodeling), and design requests only when they
 * want new-garment orders (users.does_new_garments).
 */
final class TailorWork
{
    private static ?array $options = null;

    public static function options(): array
    {
        return self::$options ??= json_decode(
            file_get_contents(resource_path('js/data/tailorWork.json')),
            true,
            flags: JSON_THROW_ON_ERROR,
        );
    }

    /**
     * Validation rules for the answers under $prefix (e.g. "work_preferences").
     * Add them only where the answers are expected: their nested rules are
     * required ones, so they fail a request that sends no answers at all.
     */
    public static function rules(string $prefix): array
    {
        $o = self::options();
        $other = 'nullable|string|max:'.$o['otherMax'];
        $comment = 'nullable|string|max:'.$o['commentMax'];

        return [
            $prefix => ['required', 'array'],
            "{$prefix}.remodel_none" => ['required', 'boolean'],
            "{$prefix}.remodel_types" => ['present', 'array'],
            "{$prefix}.remodel_types.*" => ['string', Rule::in($o['remodelTypes'])],
            "{$prefix}.remodel_other" => $other,
            "{$prefix}.new_garments" => ['required', Rule::in($o['newGarments'])],
            "{$prefix}.garment_types" => ['nullable', 'array'],
            "{$prefix}.garment_types.*" => ['string', Rule::in($o['garmentTypes'])],
            "{$prefix}.garment_other" => $other,
            "{$prefix}.complexity" => ['nullable', 'required_if:'.$prefix.'.new_garments,yes', Rule::in($o['complexity'])],
            "{$prefix}.work_notes" => $comment,
            "{$prefix}.platform_feedback" => $comment,
        ];
    }

    /**
     * The answers in one shape, or the field that is incomplete. A tailor who
     * takes remodels names at least one kind; one who wants new-garment orders
     * names at least one garment. Answers that do not apply are dropped.
     *
     * @return array{0: ?array, 1: ?string} [answers, or null; failing field, or null]
     */
    public static function normalize(array $answers): array
    {
        $text = fn ($value) => is_string($value) && trim($value) !== '' ? trim($value) : null;
        $list = fn ($value) => array_values(array_unique(array_filter((array) $value, 'is_string')));

        $none = (bool) ($answers['remodel_none'] ?? false);
        $remodelTypes = $none ? [] : $list($answers['remodel_types'] ?? []);
        $remodelOther = $none ? null : $text($answers['remodel_other'] ?? null);
        if (! $none && $remodelTypes === [] && $remodelOther === null) {
            return [null, 'remodel_types'];
        }

        $wantsNew = ($answers['new_garments'] ?? null) === 'yes';
        $garmentTypes = $wantsNew ? $list($answers['garment_types'] ?? []) : [];
        $garmentOther = $wantsNew ? $text($answers['garment_other'] ?? null) : null;
        if ($wantsNew && $garmentTypes === [] && $garmentOther === null) {
            return [null, 'garment_types'];
        }

        return [[
            'remodel_none' => $none,
            'remodel_types' => $remodelTypes,
            'remodel_other' => $remodelOther,
            'new_garments' => $answers['new_garments'],
            'garment_types' => $garmentTypes,
            'garment_other' => $garmentOther,
            'complexity' => $wantsNew ? ($answers['complexity'] ?? null) : null,
            'work_notes' => $text($answers['work_notes'] ?? null),
            'platform_feedback' => $text($answers['platform_feedback'] ?? null),
        ], null];
    }

    /** The user columns the answers set: the answers, and the two switches derived from them. */
    public static function attributes(array $normalized): array
    {
        return [
            'work_preferences' => $normalized,
            'does_remodeling' => ! $normalized['remodel_none'],
            'does_new_garments' => $normalized['new_garments'] === 'yes',
        ];
    }
}
