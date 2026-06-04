<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLayerOptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'layer_category_id' => ['required', 'integer', 'exists:layer_categories,id'],
            'parent_option_id'  => ['nullable', 'integer', 'exists:layer_options,id'],
            'name'              => ['required', 'string', 'max:120'],
            'slug'              => ['required', 'string', 'max:120'],
            'image'             => ['required', 'file', 'mimes:png,svg,jpg,jpeg,webp', 'max:4096'],
            'price_modifier'    => ['nullable', 'numeric', 'min:0'],
            'is_default'        => ['nullable', 'boolean'],
            'display_order'     => ['nullable', 'integer', 'min:0'],
        ];
    }
}
