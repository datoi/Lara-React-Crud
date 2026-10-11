<?php

use App\Models\Order;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * A remodel request carries up to ten photos of the garment. Each is its own
 * upload, so the batch has to fit the upload limits as well as the order rule.
 */
function remodelPhotosCustomer(): string
{
    $token = Str::random(60);
    User::factory()->create(['role' => 'customer', 'terms_accepted_at' => now(), 'api_token' => hash('sha256', $token)]);

    return $token;
}

function remodelWithPhotos(int $count): array
{
    return [
        'order_type' => 'remodel',
        'first_name' => 'Nino',
        'phone' => '+995555000111',
        'address' => 'Rustaveli 1',
        'city' => 'Tbilisi',
        'custom_design_data' => [
            'change_request' => 'Shorten the sleeves',
            'remodel_images' => array_map(fn (int $i) => "https://example.com/jacket-{$i}.jpg", range(1, $count)),
        ],
    ];
}

test('a remodel takes up to ten photos', function () {
    $this->withToken(remodelPhotosCustomer())->postJson('/api/orders', remodelWithPhotos(10))->assertStatus(201);

    expect(Order::firstOrFail()->custom_design_data['remodel_images'])->toHaveCount(10);
});

test('an eleventh photo is refused', function () {
    $this->withToken(remodelPhotosCustomer())->postJson('/api/orders', remodelWithPhotos(11))
        ->assertStatus(422)
        ->assertJsonValidationErrors('custom_design_data.remodel_images');

    expect(Order::count())->toBe(0);
});

test('a customer can upload a webp photo', function () {
    Storage::fake('public');
    config()->set('filesystems.uploads_disk', 'public');

    // A real WebP rather than a faked file, whose type is taken from its name:
    // validation reads the content, and this is what it has to recognise.
    $path = tempnam(sys_get_temp_dir(), 'webp');
    file_put_contents($path, base64_decode('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA'));

    $this->withToken(remodelPhotosCustomer())->postJson('/api/uploads', [
        'file' => new UploadedFile($path, 'jacket.webp', null, null, true),
    ])->assertStatus(201)->assertJsonStructure(['file_url']);

    expect(Storage::disk('public')->files('designs'))->toHaveCount(1)
        ->and(Storage::disk('public')->files('designs')[0])->toEndWith('.webp');
});

test('ten photos and then the order all fit inside a minute', function () {
    // Uploads used to share the 10-a-minute write limit with placing the
    // order, so a tenth photo left no room for the request itself.
    Storage::fake('public');
    config()->set('filesystems.uploads_disk', 'public');
    $token = remodelPhotosCustomer();

    foreach (range(1, 10) as $i) {
        $this->withToken($token)->postJson('/api/uploads', [
            'file' => UploadedFile::fake()->create("jacket-{$i}.jpg", 40, 'image/jpeg'),
        ])->assertStatus(201);
    }

    $this->withToken($token)->postJson('/api/orders', remodelWithPhotos(10))->assertStatus(201);
});
