'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import AuthLayout from '@/components/auth/AuthLayout';
import SocialButton from '@/components/auth/SocialButton';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, handleGoogleSignIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError('Vous devez accepter les conditions d\'utilisation');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(formData.email, formData.password, {});

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      router.push('/auth/verify-email');
    } catch (err) {
      setError('Une erreur est survenue lors de l\'inscription');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
            value={formData.email}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#FA4D4D] focus:ring-1 focus:ring-[#FA4D4D]"
            required
          />
        </div>

        {/* Mot de passe */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-[#2D2D2D]">
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#FA4D4D] focus:ring-1 focus:ring-[#FA4D4D] pr-12"
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

        {/* Confirmer le mot de passe */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#2D2D2D]">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#FA4D4D] focus:ring-1 focus:ring-[#FA4D4D] pr-12"
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

        {/* Conditions d'utilisation */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="acceptTerms"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-[#FA4D4D] focus:ring-[#FA4D4D]"
            required
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-600">
            J&apos;accepte les{' '}
            <Link href="/terms" className="text-[#FA4D4D] hover:text-[#FA4D4D]/80">
              conditions d&apos;utilisation
            </Link>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-[#FA4D4D] text-white py-2.5 rounded-[18px] font-semibold hover:bg-[#E63F3F] transition-colors ${
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

        {/* Bouton Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-600 font-medium border border-gray-300 px-4 py-2.5 rounded-[18px] transition-colors"
        >
          <FcGoogle className="w-5 h-5" />
          Connexion avec Google
        </button>

        <p className="text-center text-sm text-gray-600">
          Déjà inscrit ?{' '}
          <Link href="/auth/login" className="text-[#FA4D4D] hover:text-[#FA4D4D]/80">
            Se connecter
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
