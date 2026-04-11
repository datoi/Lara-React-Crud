<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Order Confirmed</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 16px; color: #1e293b; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #0f172a; padding: 28px 32px; }
  .logo { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .body { padding: 32px; }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
  p { color: #475569; line-height: 1.6; margin: 0 0 16px; }
  .order-num { display: inline-block; background: #f1f5f9; border-radius: 6px; padding: 6px 14px; font-weight: 600; color: #0f172a; font-size: 15px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; padding: 0 0 8px; border-bottom: 1px solid #e2e8f0; }
  td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; }
  .total-row td { font-weight: 700; color: #0f172a; border-bottom: none; padding-top: 14px; }
  .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo">Kere</div>
  </div>
  <div class="body">
    <h1>Order Confirmed!</h1>
    <p>Hi {{ $order->first_name }}, your order has been received and a tailor has been assigned. You'll hear back within 24 hours.</p>
    <div class="order-num">{{ $order->order_number }}</div>

    @if($order->items->count())
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:right">Price</th>
        </tr>
      </thead>
      <tbody>
        @foreach($order->items as $item)
        <tr>
          <td>
            {{ $item->product_name }}
            @if($item->color) <span style="color:#94a3b8"> · {{ $item->color }}</span>@endif
            @if($item->size) <span style="color:#94a3b8"> · {{ $item->size }}</span>@endif
            @if($item->quantity > 1) <span style="color:#94a3b8"> × {{ $item->quantity }}</span>@endif
          </td>
          <td style="text-align:right">₾{{ number_format($item->price * $item->quantity, 2) }}</td>
        </tr>
        @endforeach
        <tr>
          <td style="color:#94a3b8">Shipping</td>
          <td style="text-align:right;color:#94a3b8">₾{{ number_format($order->shipping, 2) }}</td>
        </tr>
        <tr class="total-row">
          <td>Total</td>
          <td style="text-align:right">₾{{ number_format($order->total, 2) }}</td>
        </tr>
      </tbody>
    </table>
    @else
    <p>This is a custom design order. Your tailor will be in touch to discuss pricing and details.</p>
    @endif

    <p style="margin-top:8px">Questions? Reply to this email or visit your <a href="{{ config('app.url') }}/customer-dashboard" style="color:#0f172a">dashboard</a>.</p>
  </div>
  <div class="footer">Kere — Custom Clothing Marketplace · Tbilisi, Georgia</div>
</div>
</body>
</html>
