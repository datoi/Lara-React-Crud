{{-- Every email Kere sends its customers and tailors: Georgian, one shell. --}}
<!DOCTYPE html>
<html lang="ka">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>@yield('title')</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans Georgian', 'BPG Arial', Sylfaen, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 40px 16px; color: #1e293b; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #0f172a; padding: 28px 32px; }
  .logo { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .body { padding: 32px; }
  h1 { font-size: 20px; font-weight: 700; line-height: 1.4; margin: 0 0 12px; }
  p { color: #475569; line-height: 1.7; margin: 0 0 16px; }
  a { color: #631e26; }
  .order-num { display: inline-block; background: #f1f5f9; border-radius: 6px; padding: 6px 14px; font-weight: 600; color: #0f172a; font-size: 15px; margin-bottom: 20px; }
  .status-badge { display: inline-block; background: #0f172a; color: #fff; border-radius: 6px; padding: 6px 14px; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { text-align: left; font-size: 12px; color: #94a3b8; padding: 0 0 8px; border-bottom: 1px solid #e2e8f0; }
  td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; }
  .total-row td { font-weight: 700; color: #0f172a; border-bottom: none; padding-top: 14px; }
  .row { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .row .label { color: #94a3b8; }
  .row .value { font-weight: 500; color: #0f172a; text-align: right; }
  .cta { display: inline-block; background: #631e26; color: #fff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; margin: 8px 0 16px; }
  .detail, .steps { background: #f8fafc; border-radius: 8px; padding: 16px 20px; margin: 16px 0; font-size: 14px; color: #334155; line-height: 1.7; }
  .step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
  .step:last-child { margin-bottom: 0; }
  .step-num { background: #631e26; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
  .step-text { font-size: 14px; color: #334155; line-height: 1.6; }
  .note-box { background: #f8fafc; border-left: 3px solid #e2e8f0; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #334155; }
  .code-box { background: #f1f5f9; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0f172a; }
  .muted { font-size: 13px; color: #94a3b8; }
  .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; line-height: 1.6; color: #94a3b8; }
</style>
</head>
<body>
<div class="card">
  <div class="header"><div class="logo">Kere</div></div>
  <div class="body">
    @yield('content')
  </div>
  <div class="footer">
    @hasSection('footer')
      @yield('footer')
    @else
      ეს წერილი ავტომატურად გაიგზავნა და მასზე პასუხი არ მიიღება. კითხვების შემთხვევაში მოგვწერეთ: <a href="mailto:kereforyou@gmail.com">kereforyou@gmail.com</a><br>
      შპს „კერე შენთვის“ · თბილისი, საქართველო · <a href="{{ config('app.url') }}">kereforyou.com</a>
    @endif
  </div>
</div>
</body>
</html>
