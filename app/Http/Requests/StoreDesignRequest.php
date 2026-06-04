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
            'configuration.selections' => ['required', 'array'],
            'configuration.selections.*' => ['integer'],
            'configuration.fabric_id'    => ['nullable', 'integer', 'exists:fabrics,id'],
        ];
    }
}
