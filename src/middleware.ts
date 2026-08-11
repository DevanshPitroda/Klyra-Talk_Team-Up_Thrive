import NextAuth from 'next-auth';
import authConfig from './lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isPublicRoute = ['/', '/login', '/register'].includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return;
  }

  if (isPublicRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL('/chat', nextUrl));
    }
    return;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL('/login', nextUrl));
  }

  return;
});

export const config = {
  matcher: [
    // Protect chat, admin dashboard and settings folders, skip api, static files, and icons
    '/chat/:path*',
    '/groups/:path*',
    '/contacts/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/status/:path*',
    '/admin/:path*',
  ],
};
