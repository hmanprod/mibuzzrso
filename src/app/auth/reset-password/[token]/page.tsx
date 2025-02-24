'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';

export default function NewPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // TODO: Implémenter la logique de changement de mot de passe
  };

  if (isSubmitted) {
    return (
      <AuthLayout>
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-[#2D2D2D]">Mot de passe modifié !</h2>
          <p className="text-gray-600">
            Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </p>
          <a
            href="/auth/login"
            className="block mt-6 text-[#FA4D4D] hover:text-[#E63F3F] font-medium transition-colors"
          >
            Se connecter
          </a>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-[#2D2D2D]">Créer un nouveau mot de passe</h2>
        <p className="text-gray-600">
          Votre nouveau mot de passe doit être différent des mots de passe précédemment utilisés.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nouveau mot de passe */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-[#2D2D2D]">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#FA4D4D] focus:ring-1 focus:ring-[#FA4D4D] pr-12"
              placeholder="Minimum 8 caractères"
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

        {/* Confirmation du nouveau mot de passe */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#2D2D2D]">
            Confirmer le nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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

        <button
          type="submit"
          className="w-full h-12 bg-[#FA4D4D] hover:bg-[#E63F3F] text-white font-medium rounded-[18px] transition-colors"
        >
          Réinitialiser le mot de passe
        </button>
      </form>
    </AuthLayout>
  );
}
