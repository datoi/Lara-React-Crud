<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Support Request</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 16px; color: #1e293b; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #0f172a; padding: 28px 32px; }
  .logo { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .tag { display: inline-block; background: #f1f5f9; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .body { padding: 32px; }
  h1 { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
  p { color: #475569; line-height: 1.6; margin: 0 0 12px; font-size: 14px; }
  .row { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .row .label { color: #94a3b8; min-width: 80px; }
  .row .value { color: #0f172a; font-weight: 500; }
  .message-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-top: 16px; white-space: pre-wrap; font-size: 14px; color: #334155; line-height: 1.6; }
  .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo">Kere</div>
  </div>
  <div class="body">
    <div class="tag">Support Request</div>
    <h1>{{ $subject }}</h1>
    <div class="row"><span class="label">From</span><span class="value">{{ trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: $user->email }}</span></div>
    <div class="row"><span class="label">Email</span><span class="value">{{ $user->email }}</span></div>
    <div class="row"><span class="label">User ID</span><span class="value">#{{ $user->id }}</span></div>
    <div class="message-box">{{ $body }}</div>
  </div>
  <div class="footer">Kere — reply directly to this email to respond to the customer.</div>
</div>
</body>
</html>
