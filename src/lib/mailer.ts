import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.warn('Warning: RESEND_API_KEY environment variable is not defined.');
}

export const resend = new Resend(RESEND_API_KEY || 're_mock_key');
