<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    // POST /api/uploads — customer design file (jpg, png, pdf, svg, max 10 MB)
    public function design(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf,svg|max:10240',
        ]);

        $file     = $request->file('file');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path     = $file->storeAs('designs', $filename, 'public');

        return response()->json(['file_url' => asset('storage/' . $path)], 201);
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

        $file     = $request->file('image');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path     = $file->storeAs('products', $filename, 'public');

        return response()->json([
            'url' => asset('storage/' . $path),
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

        $file     = $request->file('image');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path     = $file->storeAs('profiles', $filename, 'public');

        return response()->json([
            'url' => asset('storage/' . $path),
        ], 201);
    }

    /**
     * POST /api/tailor/id-document
     *
     * A tailor's identity document, for Kere's verification and nothing else.
     *
     * Uploaded after the account exists rather than alongside the rest of the
     * registration form, and deliberately: the form is submitted before the OTP
     * is checked, so accepting the file there would mean taking identity
     * documents from anyone who can reach the endpoint, with no verified phone
     * behind them and an orphaned file every time a registration is abandoned.
     * Here the caller is authenticated and the document belongs to a real
     * account from the moment it lands.
     *
     * It goes to the 'local' disk, which is not served over HTTP — no URL is
     * returned, because there is nothing anyone should be able to fetch. Only
     * the stored path goes on the user, and that is in the model's $hidden.
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

        $file = $request->file('document');
        $path = $file->storeAs(
            'tailor-ids',
            $user->id . '-' . Str::uuid() . '.' . $file->getClientOriginalExtension(),
            'local'
        );

        // A tailor who re-uploads replaces the old document rather than leaving
        // a second copy of their identity papers on disk.
        $previous = $user->id_document_path;
        $user->forceFill(['id_document_path' => $path])->save();

        if ($previous && $previous !== $path) {
            Storage::disk('local')->delete($previous);
        }

        return response()->json(['message' => 'Document received.'], 201);
    }
}
