<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PreviewDesignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    public function rules(): array
    {
        return [
            'product_slug'          => ['required', 'string', 'exists:customizer_products,slug'],
            'selections'            => ['required', 'array'],
            'selections.*'          => ['integer'],
            'fabric_id'             => ['nullable', 'integer', 'exists:fabrics,id'],
        ];
    }
}
