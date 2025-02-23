'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { signIn, handleGoogleSignIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else if (data?.user) {
        router.push('/');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion');
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
        
        {/* Champ email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-[#2D2D2D]">
            Nom d&apos;utilisateur ou e-mail
          </label>
          <input
            type="text"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#FA4D4D] focus:ring-1 focus:ring-[#FA4D4D]"
            required
          />
        </div>

        {/* Champ mot de passe */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-[#2D2D2D]">
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#FA4D4D] focus:ring-1 focus:ring-[#FA4D4D] pr-12"
              placeholder="Saisissez au moins 6 caractères"
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

        {/* Lien mot de passe oublié */}
        <div className="flex justify-end">
          <Link
            href="/auth/reset-password"
            className="text-sm text-[#FA4D4D] hover:text-[#E63F3F] transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Bouton de connexion */}
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
              Connexion en cours...
            </div>
          ) : (
            'Se connecter'
          )}
        </button>

        {/* Séparateur */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 text-gray-500 bg-white">ou continuer avec</span>
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

        {/* Lien d'inscription */}
        <div className="text-center text-sm text-gray-600">
          <span>Vous n&apos;avez pas de compte ? </span>
          <Link
            href="/auth/register"
            className="text-[#FA4D4D] hover:text-[#E63F3F] font-medium transition-colors"
          >
            S&apos;inscrire
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
