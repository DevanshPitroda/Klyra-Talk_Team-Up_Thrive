'use client';

import React, { Suspense, useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SpecularButton from '@/components/ui/SpecularButton';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const urlError     = searchParams.get('error');

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setIsGooglePending] = useState(false);

  const registered = searchParams.get('registered');

  const errorMessages: Record<string, string> = {
    DatabaseUnavailable: 'Database is temporarily unavailable. Please try again.',
    OAuthSignin:         'Error starting Google sign-in. Please try again.',
    OAuthCallback:       'Error completing Google sign-in. Please try again.',
    CredentialsSignin:   'Incorrect email or password.',
    Default:             'An unexpected error occurred. Please try again.',
  };

  const displayError = error || (urlError ? (errorMessages[urlError] || errorMessages.Default) : null);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Incorrect email or password. Please try again.');
      } else {
        router.push('/chat');
        router.refresh();
      }
    });
  }

  async function handleGoogleLogin() {
    setIsGooglePending(true);
    await signIn('google', { callbackUrl: '/chat' });
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-black/40 mb-4 mx-auto bg-[#2a3942] border border-[#3b4a54]/80">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-[#e9edef]">
            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.278.187 2.228 1.306 2.228 2.594V11.25c0 1.278-.94 2.397-2.206 2.584A49.08 49.08 0 0 1 12 14.25c-2.43 0-4.817-.178-7.152-.52-1.278-.187-2.228-1.306-2.228-2.594V5.365c0-1.288.95-2.407 2.228-2.594ZM3.75 16.5v.008c0 .167.007.333.02.499.08 1.04.793 1.905 1.776 2.115A49.124 49.124 0 0 0 12 19.5a49.12 49.12 0 0 0 6.454-.378c.983-.21 1.696-1.075 1.776-2.115a4.3 4.3 0 0 0 .02-.499V16.5A1.5 1.5 0 0 0 18.75 15h-13.5A1.5 1.5 0 0 0 3.75 16.5Z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#e9edef]">Welcome back</h1>
        <p className="text-[#8696a0] text-sm mt-1">Sign in to continue to Klyra</p>
      </div>

      {/* Registration Success Banner */}
      {registered && (
        <div className="w-full mb-4 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-left flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#e9edef] mt-0.5 shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-[#e9edef]">✅ Account created! Sign in with your email and password below.</p>
        </div>
      )}

      {/* Error Banner */}
      {displayError && (
        <div className="w-full mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-left flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-400 mt-0.5 shrink-0">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-red-400">{displayError}</p>
        </div>
      )}

      {/* Email / Password Form */}
      <form onSubmit={handleCredentialsLogin} className="w-full space-y-3">
        {/* Email */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696a0]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
              <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
            </svg>
          </span>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] border border-[#2a3942] focus:border-[#3b4a54] rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-colors"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696a0]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            id="login-password"
            type={showPass ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] border border-[#2a3942] focus:border-[#3b4a54] rounded-xl py-3 pl-10 pr-10 text-sm outline-none transition-colors"
          />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696a0] hover:text-[#e9edef] transition-colors">
            {showPass
              ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" /></svg>
              : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" /><path d="M10.748 13.93l2.523 2.523a10.003 10.003 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" /></svg>
            }
          </button>
        </div>

        <SpecularButton
          id="login-submit"
          type="submit"
          disabled={isPending}
          radius={12}
          tint="#ffffff"
          tintOpacity={0.18}
          lineColor="#ffffff"
          baseColor="#3b4a54"
          textColor="#ffffff"
          followMouse={true}
          autoAnimate={true}
          speed={0.4}
          className="w-full text-sm font-semibold border border-[#3b4a54]/80 shadow-lg shadow-black/30"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)' }}
        >
          {isPending ? 'Signing in…' : 'Sign In'}
        </SpecularButton>
      </form>

      {/* Divider */}
      <div className="w-full flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#2a3942]" />
        <span className="text-xs text-[#8696a0] font-medium">OR</span>
        <div className="flex-1 h-px bg-[#2a3942]" />
      </div>

      {/* Google Sign-In */}
      <SpecularButton
        id="login-google"
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGooglePending}
        radius={12}
        tint="#ffffff"
        tintOpacity={0.1}
        lineColor="#4285F4"
        baseColor="#2a3942"
        textColor="#e9edef"
        followMouse={true}
        autoAnimate={true}
        speed={0.3}
        className="w-full text-sm font-semibold border border-[#3b4a54]/80 shadow-md shadow-black/20"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' }}
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        {isGooglePending ? 'Redirecting…' : 'Continue with Google'}
      </SpecularButton>

      {/* Sign Up Link */}
      <p className="mt-6 text-sm text-[#8696a0]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[#e9edef] hover:text-white font-semibold underline underline-offset-4 transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-24 text-[#8696a0] text-sm">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
