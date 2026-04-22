<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KereNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // GET /api/notifications
    public function index(Request $request)
    {
        $user = $request->user();

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
        $user = $request->user();

        KereNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }

    // PATCH /api/notifications/{id}/read
    public function markRead(Request $request, int $id)
    {
        $user = $request->user();

        KereNotification::where('id', $id)
            ->where('user_id', $user->id)
            ->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }

    // DELETE /api/notifications/{id}
    public function destroy(Request $request, int $id)
    {
        $user = $request->user();

        KereNotification::where('id', $id)
            ->where('user_id', $user->id)
            ->delete();

        return response()->json(['ok' => true]);
    }

    // DELETE /api/notifications
    public function destroyAll(Request $request)
    {
        $user = $request->user();

        KereNotification::where('user_id', $user->id)->delete();

        return response()->json(['ok' => true]);
    }
}
