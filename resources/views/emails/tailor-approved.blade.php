<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Account Approved</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 16px; color: #1e293b; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #5a1a2a; padding: 28px 32px; }
  .logo { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .body { padding: 32px; }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
  p { color: #475569; line-height: 1.6; margin: 0 0 16px; }
  .cta { display: inline-block; background: #5a1a2a; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; margin: 8px 0 16px; }
  .steps { background: #f8fafc; border-radius: 8px; padding: 20px 24px; margin: 16px 0; }
  .step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
  .step:last-child { margin-bottom: 0; }
  .step-num { background: #5a1a2a; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .step-text { font-size: 14px; color: #334155; line-height: 1.5; }
  .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo">Kere</div>
  </div>
  <div class="body">
    <h1>You're approved, {{ $tailor->first_name }}! 🎉</h1>
    <p>Your Kere tailor account has been reviewed and approved. You can now log in to your dashboard, list your products, and start receiving orders from customers across Georgia.</p>

    <a href="{{ config('app.url') }}/login/tailor" class="cta">Go to My Dashboard</a>

    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text"><strong>Complete your profile</strong> — add a bio, specialty, and profile photo so customers can find you.</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text"><strong>List your first products</strong> — add at least 3 garments to appear in the marketplace.</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text"><strong>You're live</strong> — once your shop is set up, customers can discover and order from you.</div>
      </div>
    </div>

    <p style="margin-top:8px; font-size:13px; color:#94a3b8">Questions? Reply to this email anytime — we're here to help.</p>
  </div>
  <div class="footer">Kere — Custom Clothing Marketplace · Tbilisi, Georgia</div>
</div>
</body>
</html>
