import { resend } from '../lib/mailer';
import { getWelcomeEmailHtml } from '../lib/email-templates/welcome';
import { getAdminNotificationEmailHtml } from '../lib/email-templates/registration-admin';
import User from '../models/User';
import { connectDB } from '../lib/db';

export async function sendRegistrationEmails(userName: string, userEmail: string) {
  try {
    await connectDB();
    const totalUsers = await User.countDocuments();

    const fromEmail  = process.env.EMAIL_FROM  || 'onboarding@resend.dev';
    const adminEmail = process.env.ADMIN_EMAIL;

    // Resend free plan only delivers to the account owner's email in development.
    // In production (verified domain), emails go directly to the actual user.
    const isDev         = process.env.NODE_ENV !== 'production';
    const welcomeTarget = isDev ? (adminEmail || userEmail) : userEmail;

    // 1. Send welcome email (redirected to admin email in dev mode)
    try {
      await resend.emails.send({
        from:    fromEmail,
        to:      welcomeTarget,
        subject: isDev
          ? `[DEV] Welcome email for ${userEmail} — ${userName}`
          : 'Welcome to Klyra!',
        html: getWelcomeEmailHtml(userName),
      });
      console.log(`✅ Welcome email sent → ${welcomeTarget}${isDev ? ` (dev redirect from ${userEmail})` : ''}`);
    } catch (welcomeError) {
      console.error('❌ Failed to send welcome email:', welcomeError);
    }

    // 2. Send admin registration alert
    if (adminEmail) {
      try {
        await resend.emails.send({
          from:    fromEmail,
          to:      adminEmail,
          subject: '[Admin Alert] New User Registration',
          html:    getAdminNotificationEmailHtml(userName, userEmail, totalUsers),
        });
        console.log(`✅ Admin alert sent → ${adminEmail}`);
      } catch (adminError) {
        console.error('❌ Failed to send admin notification email:', adminError);
      }
    } else {
      console.warn('⚠️  Skipped admin email: ADMIN_EMAIL not set in environment.');
    }
  } catch (error) {
    console.error('❌ sendRegistrationEmails error:', error);
  }
}
