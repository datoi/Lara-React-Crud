<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDesignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id'            => ['required', 'integer', 'exists:customizer_products,id'],
            'name'                  => ['required', 'string', 'max:120'],
            'configuration'         => ['required', 'array'],
            // Bounded: previously any integer was accepted, so a design could be
            // stored referencing options belonging to another product, or ids
            // that never existed. See withValidator() for the ownership check.
            'configuration.selections' => ['required', 'array', 'max:30'],
            'configuration.selections.*' => ['integer', 'exists:layer_options,id'],
            'configuration.color_selections' => ['nullable', 'array', 'max:30'],
            'configuration.color_selections.*' => ['integer', 'exists:layer_option_colors,id'],
            'configuration.sub_selections' => ['nullable', 'array', 'max:30'],
            'configuration.sub_selections.*' => ['integer', 'exists:layer_options,id'],
            'configuration.fabric_id'    => ['nullable', 'integer', 'exists:fabrics,id'],
            'configuration.spec'         => ['nullable', 'array', 'max:30'],
            'configuration.spec.*.attribute' => ['required_with:configuration.spec', 'string', 'max:60'],
            'configuration.spec.*.option'    => ['required_with:configuration.spec', 'string', 'max:120'],
            'configuration.spec.*.price_modifier' => ['nullable', 'numeric', 'min:-9999', 'max:9999'],
        ];
    }

    /**
     * Every id in the configuration must belong to the product being saved.
     * Without this an id that merely exists passes — including one from a
     * different garment, which stores a design that can never resolve.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $productId = (int) $this->input('product_id');

            // Selections and sub-selections are both option ids. The sub map is
            // keyed by the parent option, so both sides of it belong here too.
            $subSelections = (array) $this->input('configuration.sub_selections', []);
            $optionIds = array_unique(array_map('intval', array_merge(
                array_values((array) $this->input('configuration.selections', [])),
                array_keys($subSelections),
                array_values($subSelections),
            )));

            if ($optionIds !== [] && $this->ownedOptions($optionIds, $productId)->count() !== count($optionIds)) {
                $validator->errors()->add(
                    'configuration.selections',
                    'The configuration references options that do not belong to this product.'
                );
            }

            // A colour is keyed by the option it belongs to, so the pair has to
            // agree as well — this product's option, wearing its own colour.
            $colorSelections = (array) $this->input('configuration.color_selections', []);
            if ($colorSelections === []) {
                return;
            }

            $owners = \App\Models\LayerOptionColor::query()
                ->whereIn('layer_option_colors.id', array_map('intval', array_values($colorSelections)))
                ->join('layer_options', 'layer_options.id', '=', 'layer_option_colors.layer_option_id')
                ->join('layer_categories', 'layer_categories.id', '=', 'layer_options.layer_category_id')
                ->where('layer_categories.customizer_product_id', $productId)
                ->pluck('layer_option_colors.layer_option_id', 'layer_option_colors.id')
                ->all();

            foreach ($colorSelections as $optionId => $colorId) {
                if (($owners[(int) $colorId] ?? null) !== (int) $optionId) {
                    $validator->errors()->add(
                        'configuration.color_selections',
                        'The configuration references colours that do not belong to this product.'
                    );
                    return;
                }
            }
        });
    }

    /** @param  int[]  $optionIds */
    private function ownedOptions(array $optionIds, int $productId): \Illuminate\Support\Collection
    {
        return \App\Models\LayerOption::query()
            ->whereIn('layer_options.id', $optionIds)
            ->join('layer_categories', 'layer_categories.id', '=', 'layer_options.layer_category_id')
            ->where('layer_categories.customizer_product_id', $productId)
            ->pluck('layer_options.id');
    }
}
