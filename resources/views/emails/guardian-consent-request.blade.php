<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Consent needed</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 16px; color: #1e293b; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #5a1a2a; padding: 28px 32px; }
  .logo { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .body { padding: 32px; }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
  p { color: #475569; line-height: 1.6; margin: 0 0 16px; }
  .cta { display: inline-block; background: #5a1a2a; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; margin: 8px 0 16px; }
  .detail { background: #f8fafc; border-radius: 8px; padding: 16px 20px; margin: 16px 0; font-size: 14px; color: #334155; line-height: 1.7; }
  .muted { font-size: 13px; color: #94a3b8; }
  .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; }
</style>
</head>
<body>
<div class="card">
  <div class="header"><span class="logo">Kere</span></div>

  <div class="body">
    <h1>Please confirm you are happy for {{ $customer->first_name }} to use Kere</h1>

    <p>
      {{ $customer->getFullName() }} has signed up to Kere, where clothes are designed
      and made to order. They gave your details as their parent or legal guardian.
    </p>

    <div class="detail">
      <strong>Who signed up:</strong> {{ $customer->getFullName() }}<br>
      @if ($customer->email)
        <strong>Their email:</strong> {{ $customer->email }}<br>
      @endif
      <strong>Given as:</strong> {{ $customer->guardian_relationship === 'legal_guardian' ? 'Legal guardian' : 'Parent' }}
    </div>

    <p>Until you confirm, the account cannot place any orders.</p>

    <a class="cta" href="{{ $consentUrl }}">Confirm consent</a>

    <p class="muted">
      If you were not expecting this, you do not need to do anything — without your
      confirmation the account stays restricted. You can also ignore this message
      and the link will simply go unused.
    </p>
  </div>

  <div class="footer">
    This link was sent only to you and works once. Please do not forward it.
  </div>
</div>
</body>
</html>
