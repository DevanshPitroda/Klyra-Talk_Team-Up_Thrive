// This file is used by the middleware (Edge Runtime).
// It must ONLY contain edge-safe providers — NO bcrypt, NO mongoose, NO Node.js APIs.
import Google from 'next-auth/providers/google';
import type { NextAuthConfig } from 'next-auth';

export default {
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    // CredentialsProvider is defined in auth.ts (Node.js runtime only)
    // because bcryptjs uses Node.js APIs incompatible with Edge Runtime.
  ],
} satisfies NextAuthConfig;
