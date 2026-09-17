<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Where uploads go, and who can fetch them.
 *
 * This is configuration rather than logic, which is exactly the kind of thing
 * that breaks without anyone noticing until a deploy has already eaten a
 * tailor's identity document.
 */
function uploader(string $role = 'tailor'): array
{
    $raw = 'tok-'.Str::random(10);

    $user = User::factory()->create(['role' => $role, 'api_token' => hash('sha256', $raw)]);

    return [$user, $raw];
}

test('without a bucket, uploads stay on the local disks', function () {
    // A laptop and a test run must behave exactly as they did before.
    config()->set('filesystems.uploads_disk', 'public');
    config()->set('filesystems.documents_disk', 'local');

    expect(config('filesystems.uploads_disk'))->toBe('public')
        ->and(config('filesystems.documents_disk'))->toBe('local');
});

test('a product photo is stored public and answers with a fetchable url', function () {
    Storage::fake('public');
    config()->set('filesystems.uploads_disk', 'public');

    [, $token] = uploader();

    // create() rather than image(): the latter needs the GD extension, which a
    // test machine is not owed, and nothing here cares about the actual pixels.
    $response = $this->withToken($token)->postJson('/api/upload/image', [
        'image' => UploadedFile::fake()->create('shirt.png', 40, 'image/png'),
    ])->assertStatus(201);

    $url = $response->json('url');

    expect($url)->toContain('/products/');
    expect(Storage::disk('public')->files('products'))->toHaveCount(1);
});

test('an identity document goes to the private disk and answers with no url', function () {
    Storage::fake('local');
    config()->set('filesystems.documents_disk', 'local');

    [$user, $token] = uploader();

    $body = $this->withToken($token)->postJson('/api/tailor/id-document', [
        'document' => UploadedFile::fake()->create('passport.pdf', 100, 'application/pdf'),
    ])->assertStatus(201)->getContent();

    // Nothing anyone could follow.
    expect($body)->not->toContain('http')
        ->and(Storage::disk('local')->files('tailor-ids'))->toHaveCount(1)
        ->and($user->fresh()->id_document_path)->toStartWith('tailor-ids/');
});

test('re-uploading replaces the document rather than keeping both', function () {
    Storage::fake('local');
    config()->set('filesystems.documents_disk', 'local');

    [$user, $token] = uploader();

    $this->withToken($token)->postJson('/api/tailor/id-document', [
        'document' => UploadedFile::fake()->create('first.pdf', 100, 'application/pdf'),
    ])->assertStatus(201);

    $first = $user->fresh()->id_document_path;

    $this->withToken($token)->postJson('/api/tailor/id-document', [
        'document' => UploadedFile::fake()->create('second.pdf', 100, 'application/pdf'),
    ])->assertStatus(201);

    expect($user->fresh()->id_document_path)->not->toBe($first)
        ->and(Storage::disk('local')->files('tailor-ids'))->toHaveCount(1);
});

test('only a tailor may upload an identity document', function () {
    [, $customerToken] = uploader('customer');

    $this->withToken($customerToken)->postJson('/api/tailor/id-document', [
        'document' => UploadedFile::fake()->create('passport.pdf', 100, 'application/pdf'),
    ])->assertStatus(403);
});

test('with a bucket configured, uploads move to object storage', function () {
    // The switch itself — if this stops working, production silently goes back
    // to writing files into a container that is about to be thrown away.
    config()->set('filesystems.disks.uploads.bucket', 'kere-uploads');
    config()->set('filesystems.disks.uploads.url', 'https://cdn.example.com');

    expect(config('filesystems.disks.uploads.driver'))->toBe('s3')
        ->and(config('filesystems.disks.documents.driver'))->toBe('s3')
        ->and(config('filesystems.disks.documents.visibility'))->toBe('private')
        ->and(config('filesystems.disks.documents.root'))->toBe('private')
        ->and(config('filesystems.disks.uploads.visibility'))->toBe('public');
});

test('the s3 adapter is actually installed', function () {
    // Without it every disk above fails at runtime, not at deploy.
    expect(class_exists(League\Flysystem\AwsS3V3\AwsS3V3Adapter::class))->toBeTrue();
});
