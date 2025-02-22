'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth } from '@/hooks/useAuth';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { pendingVerificationEmail, resendConfirmationEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Redirect if no pending email verification
  useEffect(() => {
    if (!pendingVerificationEmail) {
      router.replace('/auth/login');
    }
  }, [pendingVerificationEmail]);

  const handleResendEmail = async () => {
    setResendError(null);
    setResendSuccess(false);
    setIsResending(true);

    try {
      const { error } = await resendConfirmationEmail();
      
      if (error) {
        setResendError("Impossible d'envoyer l'email. Veuillez réessayer plus tard.");
      } else {
        setResendSuccess(true);
      }
    } catch (err) {
      console.error('Error resending email:', err);
      setResendError("Une erreur s'est produite. Veuillez réessayer plus tard.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#FFF5F5] rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-[#FA4D4D]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Vérifiez votre email</h1>
          <p className="text-gray-600">
            Nous avons envoyé un email de confirmation à{' '}
            <span className="font-medium text-gray-900">
              {pendingVerificationEmail}
            </span>
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
            className={` bg-gray-50 px-4 py-2 rounded-[18px] text-[#FA4D4D] hover:text-[#FA4D4D]/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
              isResending ? 'cursor-wait' : ''
            }`}
          >
            Cliquez ici pour renvoyer
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