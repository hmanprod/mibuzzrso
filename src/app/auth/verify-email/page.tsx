'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EnvelopeOpen } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth } from '@/hooks/useAuth';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleResendEmail = async () => {
    if (!email || isResending) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      const { error } = await signUp(email, '', {}); // Le mot de passe vide déclenchera uniquement l'envoi de l'email
      if (error) {
        setResendError("Impossible d'envoyer l'email. Veuillez réessayer plus tard.");
      } else {
        setResendSuccess(true);
      }
    } catch (err) {
      setResendError("Une erreur est survenue lors de l'envoi de l'email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#FFF5F5] rounded-full flex items-center justify-center">
            <EnvelopeOpen className="w-8 h-8 text-[#FA4D4D]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Vérifiez votre email</h1>
          <p className="text-gray-600">
            Un lien de confirmation a été envoyé à{' '}
            <span className="font-medium">{email}</span>.
            <br />
            Veuillez cliquer sur ce lien pour activer votre compte.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Vous n&apos;avez pas reçu l&apos;email ? Vérifiez votre dossier spam ou
          </p>
          <button
            type="button"
            onClick={handleResendEmail}
            disabled={isResending}
            className={`text-[#FA4D4D] hover:text-[#FA4D4D]/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
              isResending ? 'cursor-wait' : ''
            }`}
          >
            cliquez ici pour renvoyer
          </button>

          {resendError && (
            <p className="text-sm text-red-600">{resendError}</p>
          )}

          {resendSuccess && (
            <p className="text-sm text-green-600">
              Un nouvel email de confirmation a été envoyé !
            </p>
          )}
        </div>

        <div className="pt-6">
          <Link
            href="/auth/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Retour à la page de connexion
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}