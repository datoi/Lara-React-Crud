<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function image(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'image' => 'required|image|max:5120', // 5 MB
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
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:4096', // 4 MB
        ]);

        $file     = $request->file('image');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path     = $file->storeAs('profiles', $filename, 'public');

        return response()->json([
            'url' => asset('storage/' . $path),
        ], 201);
    }
}
