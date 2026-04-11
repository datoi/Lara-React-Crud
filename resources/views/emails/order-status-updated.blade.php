<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Order Status Updated</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 16px; color: #1e293b; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #0f172a; padding: 28px 32px; }
  .logo { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .body { padding: 32px; }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
  p { color: #475569; line-height: 1.6; margin: 0 0 16px; }
  .order-num { display: inline-block; background: #f1f5f9; border-radius: 6px; padding: 6px 14px; font-weight: 600; color: #0f172a; font-size: 15px; margin-bottom: 20px; }
  .status-badge { display: inline-block; background: #0f172a; color: #fff; border-radius: 6px; padding: 6px 14px; font-weight: 600; font-size: 14px; margin-bottom: 24px; }
  .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo">Kere</div>
  </div>
  <div class="body">
    <h1>Order Status Update</h1>
    <p>Hi {{ $order->first_name }}, here's an update on your order:</p>
    <div class="order-num">{{ $order->order_number }}</div><br>
    <div class="status-badge">{{ ucfirst($newStatus) }}</div>
    <p>{{ $statusMessage }}</p>
    <p>Track your order in your <a href="{{ config('app.url') }}/customer-dashboard" style="color:#0f172a">dashboard</a>.</p>
  </div>
  <div class="footer">Kere — Custom Clothing Marketplace · Tbilisi, Georgia</div>
</div>
</body>
</html>
