<?php

namespace App\Support;

/**
 * Body and garment measurements, in centimetres.
 *
 * The fields, their plausible ranges and which garments ask for which live in
 * resources/js/data/measurements.json, read here and by the frontend, so the
 * form a customer fills and the rule that checks it cannot disagree.
 *
 * Stored everywhere in one shape — a map of field key to number — whether on
 * the customer's profile, an order item's cm_measurements, or a custom order's
 * custom_design_data.measurements.
 */
class Measurements
{
    private static ?array $definition = null;

    private static function definition(): array
    {
        return self::$definition ??= json_decode(
            file_get_contents(resource_path('js/data/measurements.json')),
            true,
            flags: JSON_THROW_ON_ERROR,
        );
    }

    /** Every field key, in display order. */
    public static function keys(): array
    {
        return array_column(self::definition()['fields'], 'key');
    }

    /**
     * The fields kept on a customer's profile. Garment length describes the
     * garment, not the body — a cropped top and full trousers differ — so it is
     * asked per order and never saved.
     */
    public static function profileKeys(): array
    {
        return array_column(
            array_filter(self::definition()['fields'], fn ($f) => $f['profile']),
            'key',
        );
    }

    /**
     * Validation rules for a measurement map at $path: only known keys, each a
     * number within its plausible range. Profile maps exclude garment length.
     */
    public static function rules(string $path, bool $profile = false): array
    {
        $keys = $profile ? self::profileKeys() : self::keys();
        $rules = [$path => ['nullable', 'array:'.implode(',', $keys)]];

        foreach (self::definition()['fields'] as $field) {
            if (in_array($field['key'], $keys, true)) {
                $rules["{$path}.{$field['key']}"] = ['nullable', 'numeric', "between:{$field['min']},{$field['max']}"];
            }
        }

        return $rules;
    }

    /**
     * A validated map as it is stored: blanks dropped, values as numbers, keys
     * in display order. Null when nothing is left, so "none given" has one form.
     */
    public static function normalize(?array $values): ?array
    {
        $clean = [];
        foreach (self::keys() as $key) {
            $value = $values[$key] ?? null;
            if ($value !== null && $value !== '') {
                $clean[$key] = (float) $value;
            }
        }

        return $clean === [] ? null : $clean;
    }

    /**
     * The known keys among a product's required_measurements. Anything else —
     * head_circumference, which nothing collects — cannot be asked for and so
     * cannot be required.
     */
    public static function known(array $keys): array
    {
        return array_values(array_intersect(self::keys(), $keys));
    }
}
