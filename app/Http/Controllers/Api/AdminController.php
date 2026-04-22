<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;

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
            'is_suspended' => (bool) $u->is_suspended,
            'created_at'   => $u->created_at?->toDateString(),
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
        $order->update(['tailor_id' => $tailor->id]);

        return response()->json([
            'tailor' => ['id' => $tailor->id, 'name' => $tailor->getFullName()],
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
}
