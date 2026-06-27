<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Application Update</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 16px; color: #1e293b; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #0f172a; padding: 28px 32px; }
  .logo { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .body { padding: 32px; }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
  p { color: #475569; line-height: 1.6; margin: 0 0 16px; }
  .reason-box { background: #f8fafc; border-left: 3px solid #e2e8f0; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #334155; }
  .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo">Kere</div>
  </div>
  <div class="body">
    <h1>Application Update</h1>
    <p>Hi {{ $tailor->first_name }}, thank you for your interest in joining Kere as a tailor.</p>
    <p>After reviewing your application, we are unable to approve your account at this time.</p>

    @if($tailor->reason ?? false)
    <div class="reason-box">{{ $tailor->reason }}</div>
    @endif

    <p>If you believe this was a mistake or would like to provide additional information, please reply to this email and our team will review your case.</p>
    <p style="font-size:13px; color:#94a3b8">You may apply again after addressing any concerns mentioned above.</p>
  </div>
  <div class="footer">Kere — Custom Clothing Marketplace · Tbilisi, Georgia</div>
</div>
</body>
</html>
