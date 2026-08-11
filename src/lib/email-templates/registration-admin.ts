export function getAdminNotificationEmailHtml(
  userName: string,
  userEmail: string,
  totalUsers: number
): string {
  const now = new Date().toLocaleString('en-IN', {
    timeZone:    'Asia/Kolkata',
    dateStyle:   'medium',
    timeStyle:   'short',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Admin] New User Registered</title>
</head>
<body style="margin:0;padding:0;background-color:#0b1215;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b1215;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111b21;border-radius:16px;overflow:hidden;border:1px solid #1f2c34;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%);padding:36px 40px 28px;text-align:center;">
              <div style="width:52px;height:52px;background:rgba(255,255,255,0.15);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;">
                <span style="font-size:26px;">🛡️</span>
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">New User Registration</h1>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Admin Notification · Klyra</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px;font-size:14px;color:#8696a0;line-height:1.6;">
                A new user has joined Klyra. Here are the registration details:
              </p>

              <!-- Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1f2c34;border-radius:12px;overflow:hidden;border:1px solid #2a3942;margin-bottom:24px;">
                <tr style="border-bottom:1px solid #2a3942;">
                  <td style="padding:14px 20px;font-size:12px;font-weight:700;color:#8696a0;text-transform:uppercase;letter-spacing:0.5px;width:40%;">Full Name</td>
                  <td style="padding:14px 20px;font-size:14px;color:#e9edef;font-weight:600;">${userName}</td>
                </tr>
                <tr style="border-bottom:1px solid #2a3942;">
                  <td style="padding:14px 20px;font-size:12px;font-weight:700;color:#8696a0;text-transform:uppercase;letter-spacing:0.5px;">Email</td>
                  <td style="padding:14px 20px;font-size:14px;color:#00a884;">${userEmail}</td>
                </tr>
                <tr style="border-bottom:1px solid #2a3942;">
                  <td style="padding:14px 20px;font-size:12px;font-weight:700;color:#8696a0;text-transform:uppercase;letter-spacing:0.5px;">Registered At</td>
                  <td style="padding:14px 20px;font-size:14px;color:#e9edef;">${now} IST</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;font-size:12px;font-weight:700;color:#8696a0;text-transform:uppercase;letter-spacing:0.5px;">Total Users</td>
                  <td style="padding:14px 20px;">
                    <span style="background:#00a884;color:#ffffff;font-size:13px;font-weight:700;padding:3px 10px;border-radius:20px;">${totalUsers}</span>
                  </td>
                </tr>
              </table>

              <!-- Milestone badge -->
              ${totalUsers % 10 === 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#f59e0b22,#f59e0b11);border:1px solid #f59e0b44;border-radius:10px;padding:14px 20px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#f59e0b;font-weight:600;">🎉 Milestone! You now have ${totalUsers} registered users!</p>
                  </td>
                </tr>
              </table>` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d1418;padding:20px 40px;border-top:1px solid #1f2c34;text-align:center;">
              <p style="margin:0;font-size:12px;color:#8696a0;">This is an automated admin alert from Klyra. Do not reply to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
