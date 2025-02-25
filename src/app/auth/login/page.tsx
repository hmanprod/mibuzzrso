'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, handleGoogleSignIn, user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const next = searchParams.get('next') || '/feed';
    if (window.location.pathname === next) return;
  }, [router, searchParams, mounted, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        setError(error.message);
        return;
      }

      if (data?.user) {
        const next = searchParams.get('next') || '/feed';
        router.push(next);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await handleGoogleSignIn();
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Google login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-[#2D2D2D]">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-[#2D2D2D]">
              Password
            </label>
            <Link href="/auth/reset-password" className="text-sm text-primary hover:text-primary/80">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-primary text-white py-2.5 rounded-[18px] font-semibold hover:bg-primary/80 transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </div>
          ) : (
            'Sign in'
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-600 font-medium border border-gray-300 px-4 py-2.5 rounded-[18px] transition-colors"
        >
          <FcGoogle className="w-5 h-5" />
          Google
        </button>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
