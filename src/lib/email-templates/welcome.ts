export function getWelcomeEmailHtml(userName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Klyra!</title>
</head>
<body style="margin:0;padding:0;background-color:#0b1215;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b1215;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111b21;border-radius:16px;overflow:hidden;border:1px solid #1f2c34;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#00a884 0%,#007a61 100%);padding:40px 40px 32px;text-align:center;">
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="font-size:28px;">💬</span>
              </div>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Welcome to Klyra!</h1>
              <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">Talk, Team-Up, Thrive</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e9edef;">Hi ${userName}! 👋</p>
              <p style="margin:0 0 24px;font-size:15px;color:#8696a0;line-height:1.6;">
                Your Klyra account has been successfully created. You&rsquo;re all set to start connecting and collaborating instantly.
              </p>

              <!-- Feature Cards -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="48%" style="background:#1f2c34;border-radius:12px;padding:18px;border:1px solid #2a3942;">
                    <p style="margin:0 0 6px;font-size:20px;">⚡</p>
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#e9edef;">Real-time Messaging</p>
                    <p style="margin:0;font-size:12px;color:#8696a0;line-height:1.5;">Instant delivery, always in sync</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:#1f2c34;border-radius:12px;padding:18px;border:1px solid #2a3942;">
                    <p style="margin:0 0 6px;font-size:20px;">👥</p>
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#e9edef;">Group Chats</p>
                    <p style="margin:0;font-size:12px;color:#8696a0;line-height:1.5;">Create groups, collaborate together</p>
                  </td>
                </tr>
                <tr><td colspan="3" style="height:12px;"></td></tr>
                <tr>
                  <td width="48%" style="background:#1f2c34;border-radius:12px;padding:18px;border:1px solid #2a3942;">
                    <p style="margin:0 0 6px;font-size:20px;">🎓</p>
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#e9edef;">Study &amp; Meeting Rooms</p>
                    <p style="margin:0;font-size:12px;color:#8696a0;line-height:1.5;">Video calls, whiteboards &amp; polls</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:#1f2c34;border-radius:12px;padding:18px;border:1px solid #2a3942;">
                    <p style="margin:0 0 6px;font-size:20px;">🔒</p>
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#e9edef;">Secure &amp; Private</p>
                    <p style="margin:0;font-size:12px;color:#8696a0;line-height:1.5;">End-to-end encrypted chats</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/chat"
                      style="display:inline-block;background:linear-gradient(135deg,#00a884 0%,#007a61 100%);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
                      Open Klyra →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d1418;padding:24px 40px;border-top:1px solid #1f2c34;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#8696a0;">
                You received this email because you signed up for Klyra.
              </p>
              <p style="margin:0;font-size:12px;color:#667781;">© 2026 Klyra. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
