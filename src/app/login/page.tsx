'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { error: authError } = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      router.push('/');
    }
  };

  const socialSignIn = async (provider: string) => {
    await supabase.auth.signInWithOAuth({ provider: provider as any });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4"
      >
        <h1 className="text-3xl font-bold text-center">{isSignup ? 'Sign Up' : 'Log In'}</h1>
        <p className="text-gray-600 text-center">
          {isSignup ? 'Create a new account' : 'Welcome back! Please log in.'}
        </p>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {isSignup && (
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition cursor-pointer"
        >
          {loading
            ? isSignup
              ? 'Signing up...'
              : 'Logging in...'
            : isSignup
            ? 'Sign Up'
            : 'Log In'}
        </button>

        <div className="flex items-center justify-center space-x-4 pt-4">
          <span className="text-gray-500">Or continue with</span>
          <button type="button" onClick={() => socialSignIn('google')}>
            <img src="/google-icon.svg" alt="Google" className="h-6 w-6 cursor-pointer" />
          </button>
          <button type="button" onClick={() => socialSignIn('facebook')}>
            <img src="/facebook-icon.svg" alt="Facebook" className="h-6 w-6 cursor-pointer" />
          </button>
          <button type="button" onClick={() => socialSignIn('apple')}>
            <img src="/apple-icon.svg" alt="Apple" className="h-6 w-6 cursor-pointer" />
          </button>
        </div>

        <p className="text-sm text-center text-gray-500 mt-2">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            {isSignup ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </form>
    </div>
  );
}
