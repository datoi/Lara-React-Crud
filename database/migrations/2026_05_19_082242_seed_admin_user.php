<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        // Insert admin user only if one doesn't already exist
        if (! DB::table('users')->where('name', 'Admin')->where('role', 'admin')->exists()) {
            DB::table('users')->insert([
                'name'              => 'Admin',
                'email'             => 'admin@kere.ge',
                'password'          => Hash::make('admin123'),
                'role'              => 'admin',
                'email_verified_at' => now(),
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('users')->where('name', 'Admin')->where('role', 'admin')->delete();
    }
};
