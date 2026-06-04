<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Kere verification code</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
        <tr>
            <td align="center">
                <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;max-width:500px;width:100%;">
                    <!-- Header -->
                    <tr>
                        <td style="background:#0f172a;padding:24px 32px;">
                            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Kere</span>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 8px;font-size:16px;color:#1e293b;">Hi {{ $firstName }},</p>
                            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
                                Use the code below to verify your email address. It expires in 10 minutes.
                            </p>

                            <!-- OTP box -->
                            <div style="background:#f1f5f9;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                                <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0f172a;">{{ $code }}</span>
                            </div>

                            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
                                If you didn't request this, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="border-top:1px solid #f1f5f9;padding:16px 32px;">
                            <p style="margin:0;font-size:12px;color:#94a3b8;">
                                &copy; {{ date('Y') }} Kere. Georgian custom clothing, made to order.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
