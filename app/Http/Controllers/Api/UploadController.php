<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Everything a user uploads.
 *
 * Nothing here names a disk. `filesystems.uploads_disk` and
 * `filesystems.documents_disk` resolve to object storage when a bucket is
 * configured and to the local disks when one is not, so a laptop behaves as it
 * always did while a deployed container — whose filesystem is replaced on every
 * release — keeps what it is given.
 *
 * The two disks are not interchangeable. Product photos are meant to be fetched
 * by anyone holding the link; identity documents are meant to be fetched by
 * nobody without a signed one, and never have a URL handed out at all.
 */
class UploadController extends Controller
{
    /**
     * Store a public file and return the URL it can be fetched from.
     *
     * Named by its content, never by the name the browser sent: validation
     * checks what the file is, so a page called `x.html` that starts like a PNG
     * is stored, and served, as a PNG. An SVG can carry script, so it is served
     * as a download rather than opened in place; inside an <img>, where scripts
     * never run, it still shows.
     */
    private function storePublic(UploadedFile $file, string $folder): string
    {
        $disk = config('filesystems.uploads_disk');
        $extension = $file->extension();
        $options = ['disk' => $disk, 'visibility' => 'public'];

        if ($extension === 'svg') {
            $options['ContentDisposition'] = 'attachment';
        }

        $path = $file->storeAs($folder, Str::uuid().'.'.$extension, $options);

        // Asked of the disk rather than assembled from APP_URL: the same code
        // then returns a /storage path locally and a bucket URL in production.
        return Storage::disk($disk)->url($path);
    }

    // POST /api/uploads — customer design file or remodel photo (jpg, png, webp, pdf, svg, max 10 MB)
    public function design(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,webp,pdf,svg|max:10240',
        ]);

        return response()->json([
            'file_url' => $this->storePublic($request->file('file'), 'designs'),
        ], 201);
    }

    public function image(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp|max:5120', // 5 MB
        ]);

        return response()->json([
            'url' => $this->storePublic($request->file('image'), 'products'),
        ], 201);
    }

    /**
     * A tailor's photo of a customer's garment: as it arrived, or finished
     * (terms §12). The customer sees these on their order page.
     */
    public function orderPhoto(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp|max:10240',
        ]);

        return response()->json([
            'url' => $this->storePublic($request->file('image'), 'order-photos'),
        ], 201);
    }

    public function profileImage(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp|max:5120', // 5 MB
        ]);

        return response()->json([
            'url' => $this->storePublic($request->file('image'), 'profiles'),
        ], 201);
    }

    /**
     * POST /api/tailor/id-document
     *
     * A tailor's identity document, for Kere's verification and nothing else.
     *
     * Uploaded after the account exists rather than alongside the registration
     * form, and deliberately: the form is submitted before the one-time code is
     * checked, so accepting the file there would mean taking identity documents
     * from anyone who can reach the endpoint, with no verified phone behind them
     * and an orphan on disk every time a registration is abandoned.
     *
     * Written to the private disk, which is not public even when the bucket's
     * own hostname is. No URL is returned, because there is nothing anyone
     * should be able to fetch; only the stored path goes on the user, and that
     * is in the model's $hidden.
     */
    public function tailorIdDocument(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'document' => 'required|file|mimes:jpeg,png,webp,pdf|max:10240', // 10 MB
        ]);

        $disk = config('filesystems.documents_disk');
        $file = $request->file('document');

        $path = $file->storeAs(
            'tailor-ids',
            $user->id.'-'.Str::uuid().'.'.$file->extension(),
            ['disk' => $disk, 'visibility' => 'private']
        );

        // A tailor who re-uploads replaces the old document rather than leaving
        // a second copy of their identity papers behind.
        $previous = $user->id_document_path;
        $user->forceFill(['id_document_path' => $path])->save();

        if ($previous && $previous !== $path) {
            Storage::disk($disk)->delete($previous);
        }

        return response()->json(['message' => 'Document received.'], 201);
    }
}
