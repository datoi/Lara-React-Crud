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
}
