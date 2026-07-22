<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>A Tailor Wants to Make Your Design</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 16px; color: #1e293b; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #0f172a; padding: 28px 32px; }
  .logo { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .body { padding: 32px; }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
  p { color: #475569; line-height: 1.6; margin: 0 0 16px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .row .label { color: #94a3b8; }
  .row .value { font-weight: 500; color: #0f172a; }
  .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo">Kere</div>
  </div>
  <div class="body">
    <h1>A Tailor Wants to Make Your Design!</h1>
    <p>{{ $tailor->getFullName() }} has offered to make your custom design. Review their profile and offer, then choose the tailor you like best.</p>

    <div class="row"><span class="label">Order #</span><span class="value">{{ $order->order_number }}</span></div>
    <div class="row"><span class="label">Tailor</span><span class="value">{{ $tailor->getFullName() }}</span></div>
    @if($tailor->specialty)
    <div class="row"><span class="label">Specialty</span><span class="value">{{ $tailor->specialty }}</span></div>
    @endif
    @if($tailor->years_experience)
    <div class="row"><span class="label">Experience</span><span class="value">{{ $tailor->years_experience }} years</span></div>
    @endif

    <p style="margin-top:20px">Visit your <a href="{{ config('app.url') }}/customer-dashboard" style="color:#0f172a">dashboard</a> to compare offers and pick your tailor.</p>
  </div>
  <div class="footer">Kere — Custom Clothing Marketplace · Tbilisi, Georgia</div>
</div>
</body>
</html>
