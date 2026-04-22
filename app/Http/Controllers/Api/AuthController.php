<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * POST /api/register
     * Body: { first_name, last_name, email, phone, password, password_confirmation, role }
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name'  => ['required', 'string', 'max:100'],
            'email'      => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone'      => ['required', 'string', 'max:30'],
            'password'   => ['required', 'confirmed', Password::min(8)],
            'role'       => ['required', 'in:customer,tailor'],
        ]);

        $token = Str::random(60);

        $user = User::create([
            'first_name' => $data['first_name'],
            'last_name'  => $data['last_name'],
            'name'       => $data['first_name'] . ' ' . $data['last_name'],
            'email'      => $data['email'],
            'phone'      => $data['phone'],
            'role'       => $data['role'],
            'password'   => Hash::make($data['password']),
            'api_token'  => hash('sha256', $token),
        ]);

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'         => $user->id,
                'first_name' => $user->first_name,
                'last_name'  => $user->last_name,
                'name'       => $user->name,
                'email'      => $user->email,
                'phone'      => $user->phone,
                'role'       => $user->role,
            ],
        ], 201);
    }

    /**
     * POST /api/login
     * Body: { email, password }
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
            'role'     => ['required', 'in:customer,tailor,admin'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 401);
        }

        if ($user->is_suspended) {
            return response()->json([
                'message' => 'This account has been suspended.',
            ], 403);
        }

        // Admin can log in regardless of which role was selected on the form
        if ($user->role !== 'admin' && $user->role !== $data['role']) {
            $expected = ucfirst($data['role']);
            return response()->json([
                'message' => "Access denied. This account is not registered as a {$expected}.",
            ], 403);
        }

        // Rotate token on each login
        $token = Str::random(60);
        $user->update(['api_token' => hash('sha256', $token)]);

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'         => $user->id,
                'first_name' => $user->first_name,
                'last_name'  => $user->last_name,
                'name'       => $user->name,
                'email'      => $user->email,
                'phone'      => $user->phone,
                'role'       => $user->role,
            ],
        ]);
    }
}
