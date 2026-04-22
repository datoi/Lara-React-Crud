<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\SupportRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SupportEmailController extends Controller
{
    // POST /api/support-email
    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        // Major #9: guard against unconfigured SUPPORT_EMAIL
        $supportEmail = config('services.support.email');
        if (! $supportEmail) {
            Log::error('SUPPORT_EMAIL is not configured — support message from user #' . $user->id . ' was not emailed.');
            return response()->json(['message' => 'Support system is temporarily unavailable. Please try again later.'], 503);
        }

        DB::table('support_messages')->insert([
            'user_id'    => $user->id,
            'from_email' => $user->email,
            'subject'    => $data['subject'],
            'message'    => $data['message'],
            'resolved'   => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            Mail::to($supportEmail)->queue(new SupportRequest($user, $data['subject'], $data['message']));
        } catch (\Throwable $e) {
            Log::error('SupportRequest email failed: ' . $e->getMessage());
            // Row is already committed — return 202 so the client doesn't retry and create duplicates
            return response()->json([
                'success' => true,
                'warning' => 'Your message was saved but the confirmation email could not be sent.',
            ], 202);
        }

        return response()->json(['success' => true]);
    }
}
