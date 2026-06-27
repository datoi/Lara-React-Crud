<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\TailorApproved;
use App\Mail\TailorRejected;
use App\Models\KereNotification;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AdminController extends Controller
{
    // GET /api/admin/orders
    public function orders()
    {
        $orders = Order::with(['user', 'tailor', 'items'])
            ->latest()
            ->get()
            ->map(fn($o) => [
                'id'           => $o->id,
                'order_number' => $o->order_number,
                'order_type'   => $o->order_type,
                'status'       => $o->status,
                'total'        => $o->total,
                'created_at'   => $o->created_at?->toDateString(),
                'customer'     => $o->user ? [
                    'id'    => $o->user->id,
                    'name'  => $o->user->getFullName(),
                    'email' => $o->user->email,
                ] : null,
                'tailor_assignment_mode' => $o->tailor_assignment_mode ?? 'manual',
                'tailor' => $o->tailor ? [
                    'id'   => $o->tailor->id,
                    'name' => $o->tailor->getFullName(),
                ] : null,
                'items' => $o->items->map(fn($i) => [
                    'id'           => $i->id,
                    'product_name' => $i->product_name,
                    'quantity'     => $i->quantity,
                    'price'        => $i->price,
                ])->values()->all(),
            ]);

        return response()->json(['orders' => $orders]);
    }

    // GET /api/admin/users
    public function users()
    {
        $users = User::latest()->get()->map(fn($u) => [
            'id'           => $u->id,
            'name'         => $u->getFullName(),
            'email'        => $u->email,
            'role'         => $u->role,
            'is_suspended'    => (bool) $u->is_suspended,
            'approval_status' => $u->approval_status,
            'created_at'      => $u->created_at?->toDateString(),
        ]);

        return response()->json(['users' => $users]);
    }

    // PATCH /api/admin/orders/{id}/assign
    public function assignTailor(Request $request, int $id)
    {
        $data = $request->validate([
            'tailor_id' => 'required|integer|exists:users,id',
        ]);

        $tailor = User::where('id', $data['tailor_id'])
            ->where('role', 'tailor')
            ->firstOrFail();

        $order = Order::findOrFail($id);
        $wasUnassigned = $order->status === 'pending_assignment';

        $updates = ['tailor_id' => $tailor->id];
        if ($wasUnassigned) {
            $updates['status'] = 'pending';
        }
        $order->update($updates);

        // Notify the customer that their order now has a tailor
        if ($wasUnassigned && $order->user_id) {
            KereNotification::create([
                'user_id' => $order->user_id,
                'type'    => 'order_assigned',
                'title'   => 'Tailor Assigned!',
                'body'    => "A tailor has been assigned to your order #{$order->order_number}.",
                'data'    => ['order_id' => $order->id],
                'is_read' => false,
            ]);
        }

        return response()->json([
            'tailor'  => ['id' => $tailor->id, 'name' => $tailor->getFullName()],
            'status'  => $order->fresh()->status,
        ]);
    }

    // PATCH /api/admin/users/{id}/suspend
    public function suspendUser(int $id)
    {
        $user = User::findOrFail($id);

        if ($user->role === 'admin') {
            return response()->json(['message' => 'Cannot suspend admin accounts.'], 422);
        }

        $user->update(['is_suspended' => ! $user->is_suspended]);

        return response()->json(['is_suspended' => (bool) $user->is_suspended]);
    }

    // GET /api/admin/tailors/pending
    public function pendingTailors()
    {
        $tailors = User::where('role', 'tailor')
            ->where('approval_status', 'pending')
            ->latest()
            ->get()
            ->map(fn($u) => [
                'id'         => $u->id,
                'name'       => $u->getFullName(),
                'email'      => $u->email,
                'phone'      => $u->phone,
                'created_at' => $u->created_at?->toDateString(),
            ]);

        return response()->json(['tailors' => $tailors]);
    }

    // POST /api/admin/tailors/{id}/approve
    public function approveTailor(int $id)
    {
        $tailor = User::where('role', 'tailor')->findOrFail($id);
        $tailor->update(['approval_status' => 'approved']);

        KereNotification::create([
            'user_id' => $tailor->id,
            'type'    => 'account_approved',
            'title'   => 'Your account has been approved!',
            'body'    => 'You can now log in, list your products, and start receiving orders.',
            'data'    => [],
            'is_read' => false,
        ]);

        try {
            Mail::to($tailor->email)->send(new TailorApproved($tailor));
        } catch (\Throwable $e) {
            Log::error('TailorApproved email failed: ' . $e->getMessage());
        }

        return response()->json(['approval_status' => 'approved']);
    }

    // POST /api/admin/tailors/{id}/reject
    public function rejectTailor(Request $request, int $id)
    {
        $data   = $request->validate(['reason' => 'nullable|string|max:500']);
        $tailor = User::where('role', 'tailor')->findOrFail($id);
        $tailor->update(['approval_status' => 'rejected']);

        try {
            $mail = new TailorRejected($tailor, $data['reason'] ?? '');
            Mail::to($tailor->email)->send($mail);
        } catch (\Throwable $e) {
            Log::error('TailorRejected email failed: ' . $e->getMessage());
        }

        return response()->json(['approval_status' => 'rejected']);
    }
}
