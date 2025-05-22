'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import AuthLayout from '@/components/auth/AuthLayout';
import { register, signInWithGoogle } from './actions';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoogleSignIn() {
    setIsLoading(true);
    setError(null);
    
    try {
      
      const result = await signInWithGoogle();
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch (e) {
      console.error(e);
      setError('Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log("the form data", event.currentTarget)

    const formData = new FormData(event.currentTarget);
    

    try {
      const result = await register(formData);
      console.log("the result", result)
      if (result?.error) {
        setError(result.error);
      }
    } catch (e) {
      console.error(e);
      setError('Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  }

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
            className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-[#2D2D2D]">
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
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

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#2D2D2D]">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="acceptTerms"
            name="acceptTerms"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            required
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-600">
            J&apos;accepte les{' '}
            <Link href="/privacy-policy" className="text-primary hover:text-primary/80">
              politique de confidentialité
            </Link> et les{' '}
            <Link href="/terms" className="text-primary hover:text-primary/80">
              conditions d&apos;utilisation
            </Link>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-primary t
            ext-white py-2.5 rounded-[18px] font-semibold hover:bg-primary/80 transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Inscription en cours...
            </div>
          ) : (
            'S\'inscrire'
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
          </div>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-600 font-medium border border-gray-300 px-4 py-2.5 rounded-[18px] transition-colors"
        >
          <FcGoogle className="w-5 h-5" />
          Google
        </button>

        <p className="text-center text-sm text-gray-600">
          Vous avez déjà un compte ?{' '}
          <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
            Se connecter
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
