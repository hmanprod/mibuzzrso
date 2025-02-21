'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // TODO: Implémenter la logique de réinitialisation
  };

  if (isSubmitted) {
    return (
      <AuthLayout>
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-[#2D2D2D]">Email envoyé !</h2>
          <p className="text-gray-600">
            Si un compte existe avec l&apos;adresse {email}, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
          </p>
          <Link
            href="/auth/login"
            className="block mt-6 text-[#FA4D4D] hover:text-[#E63F3F] font-medium transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-[#2D2D2D]">Mot de passe oublié ?</h2>
        <p className="text-gray-600">
          Entrez votre adresse e-mail ci-dessous et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-[#2D2D2D]">
            Adresse e-mail
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#FA4D4D] focus:ring-1 focus:ring-[#FA4D4D]"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full h-12 bg-[#FA4D4D] hover:bg-[#E63F3F] text-white font-medium rounded-[18px] transition-colors"
        >
          Envoyer les instructions
        </button>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm text-[#FA4D4D] hover:text-[#E63F3F] font-medium transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
