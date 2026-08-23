// This file runs in Node.js runtime only (server components, API routes).
// It is safe to import bcryptjs, mongoose, etc. here.
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import authConfig from './auth.config';
import { connectDB } from './db';
import User from '../models/User';
import { sendRegistrationEmails } from '../services/email.service';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Google provider (also in authConfig for middleware — duplicating here is fine)
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),

    // Credentials provider — bcryptjs is Node.js only, never runs in Edge Runtime
    Credentials({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email    = credentials?.email    as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        try {
          await connectDB();
          // Select password field explicitly (it is select:false by default)
          const user = await User.findOne({ email }).select('+password');
          if (!user || !user.password) return null;

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;

          return {
            id:    user._id.toString(),
            name:  user.name,
            email: user.email,
            image: user.image ?? undefined,
            role:  user.role,
          };
        } catch (err) {
          console.error('Credentials authorize error:', err);
          return null;
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async signIn({ user, account }) {
      // Credentials: already verified in authorize() — allow directly
      if (account?.provider === 'credentials') return true;

      // Google: create user in DB if first sign-in
      if (account?.provider === 'google') {
        if (!user.email || !user.name) return false;

        try {
          await connectDB();
          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Generate unique username from Google display name
            const base = user.name
              .toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[^a-z0-9_]/g, '')
              .slice(0, 20);

            let username = base;
            let counter  = 1;
            while (await User.findOne({ username })) {
              username = `${base}${counter++}`;
            }

            existingUser = await User.create({
              name:          user.name,
              username,
              email:         user.email,
              image:         user.image ?? undefined,
              role:          'user',
              isOnline:      false,
              emailVerified: new Date(),
            });

            // Send welcome + admin emails asynchronously
            sendRegistrationEmails(existingUser.name, existingUser.email).catch((err) =>
              console.error('Email service error:', err)
            );
          }

          user.id   = existingUser._id.toString();
          user.role = existingUser.role;
          return true;
        } catch (error) {
          console.error('DB error in Google signIn callback:', error);
          return '/login?error=DatabaseUnavailable';
        }
      }

      return false;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id || token.sub || '';
        token.role = (user.role || 'user') as 'user' | 'admin';
        if (user.image) token.picture = user.image;
      }
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      if (trigger === 'update' && session?.image) {
        token.picture = session.image;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id   = (token.id || token.sub || '') as string;
        session.user.role = (token.role as 'user' | 'admin') || 'user';
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },
});

export type { Session } from 'next-auth';
export type { JWT }     from 'next-auth/jwt';
