<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Arial', sans-serif;
      background: #f3f5f8;
      padding: 40px 20px;
    }
    .wrap {
      max-width: 480px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(11,15,106,.10);
    }
    .header {
      background: linear-gradient(135deg, #0B0F6A 0%, #1576A5 60%, #1FA3BD 100%);
      padding: 36px 32px;
      text-align: center;
    }
    .header-title {
      color: white;
      font-size: 22px;
      font-weight: 700;
      margin-top: 4px;
      letter-spacing: 0.5px;
    }
    .header-sub {
      color: rgba(255,255,255,0.65);
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .body {
      padding: 36px 32px;
      color: #374151;
      font-size: 14px;
      line-height: 1.7;
    }
    .body p { margin-bottom: 16px; }
    .btn-wrap { text-align: center; margin: 28px 0; }
    .btn {
      display: inline-block;
      padding: 14px 40px;
      background: linear-gradient(135deg, #0B0F6A 0%, #1576A5 60%, #1FA3BD 100%);
      color: white !important;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 0.2px;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 24px 0;
    }
    .link-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 12px;
      color: #6b7280;
      word-break: break-all;
    }
    .footer {
      text-align: center;
      padding: 16px 32px 28px;
      font-size: 11.5px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="header-title">🌸 FlowerPlus Admin</div>
      <div class="header-sub">Reset Password Request</div>
    </div>

    <div class="body">
      <p>Halo,</p>
      <p>Kami menerima permintaan untuk mereset password akun <strong>FlowerPlus Admin</strong> Anda. Klik tombol di bawah untuk melanjutkan:</p>

      <div class="btn-wrap">
        <a href="{{ $url }}" class="btn">Reset Password</a>
      </div>

      <p>Link ini akan <strong>kadaluarsa dalam 60 menit</strong>.</p>
      <p>Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.</p>

      <div class="divider"></div>

      <p style="font-size:12px; color:#6b7280;">Jika tombol tidak berfungsi, copy dan paste link berikut ke browser Anda:</p>
      <div class="link-box">{{ $url }}</div>
    </div>

    <div class="footer">
      FlowerPlus Admin &nbsp;·&nbsp; Secure Login &nbsp;·&nbsp; 2026
    </div>
  </div>
</body>
</html>