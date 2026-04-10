<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SupportEmailController extends Controller
{
    private function authedUser(Request $request): ?User
    {
        $raw = $request->bearerToken();
        if (!$raw) return null;
        return User::where('api_token', hash('sha256', $raw))->first();
    }

    // POST /api/support-email
    public function store(Request $request)
    {
        $user = $this->authedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $data = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        // Store in DB
        DB::table('support_messages')->insert([
            'user_id'    => $user->id,
            'from_email' => $user->email,
            'subject'    => $data['subject'],
            'message'    => $data['message'],
            'resolved'   => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Send email
        $fromEmail = $user->email;
        $fromName  = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: $user->email;
        $subject   = $data['subject'];
        $body      = $data['message'];

        Mail::raw(
            "Support message from: {$fromName} <{$fromEmail}>\n\n{$body}",
            function ($mail) use ($fromEmail, $fromName, $subject) {
                $mail->to('dato.tadiashvili13@gmail.com')
                     ->replyTo($fromEmail, $fromName)
                     ->subject("[Kere Support] {$subject}");
            }
        );

        return response()->json(['success' => true]);
    }
}
