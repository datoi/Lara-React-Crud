<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KereNotification;
use App\Models\User;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    private function authedUser(Request $request): ?User
    {
        $raw = $request->bearerToken();
        if (!$raw) return null;
        return User::where('api_token', hash('sha256', $raw))->first();
    }

    // GET /api/notifications
    public function index(Request $request)
    {
        $user = $this->authedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $notifications = KereNotification::where('user_id', $user->id)
            ->latest()
            ->take(50)
            ->get();

        $unreadCount = KereNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    // POST /api/notifications/read-all
    public function markAllRead(Request $request)
    {
        $user = $this->authedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        KereNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }

    // PATCH /api/notifications/{id}/read
    public function markRead(Request $request, int $id)
    {
        $user = $this->authedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        KereNotification::where('id', $id)
            ->where('user_id', $user->id)
            ->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }

    // DELETE /api/notifications/{id}
    public function destroy(Request $request, int $id)
    {
        $user = $this->authedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        KereNotification::where('id', $id)
            ->where('user_id', $user->id)
            ->delete();

        return response()->json(['ok' => true]);
    }

    // DELETE /api/notifications
    public function destroyAll(Request $request)
    {
        $user = $this->authedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        KereNotification::where('user_id', $user->id)->delete();

        return response()->json(['ok' => true]);
    }
}
