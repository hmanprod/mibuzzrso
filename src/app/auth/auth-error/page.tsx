'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Une erreur est survenue lors de l&apos;authentification';

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-red-50 text-red-600">
          <h2 className="text-lg font-medium mb-2">Erreur d&apos;authentification</h2>
          <p className="mb-4">{error}</p>
          <div className="border-t border-red-200 pt-4 mt-4">
            <h3 className="font-medium mb-2">Informations de débogage:</h3>
            <pre className="text-xs p-3 bg-red-100 rounded overflow-auto">
              {JSON.stringify({ 
                error,
                timestamp: new Date().toISOString(),
                url: typeof window !== 'undefined' ? window.location.href : '',
              }, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="text-center space-y-4">
          <p>Voici quelques actions qui pourraient résoudre le problème:</p>
          <ul className="text-left list-disc pl-5 space-y-2">
            <li>Vérifiez que vos cookies sont activés dans votre navigateur</li>
            <li>Essayez de vous reconnecter</li>
            <li>Effacez votre cache et vos cookies</li>
            <li>Essayez un autre navigateur</li>
          </ul>
          
          <div className="pt-4 flex flex-col space-y-3">
            <Link 
              href="/auth/login" 
              className="w-full bg-primary text-white py-2.5 rounded-[18px] font-semibold hover:bg-primary/80 transition-colors"
            >
              Retourner à la page de connexion
            </Link>
            <Link 
              href="/" 
              className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-[18px] font-semibold hover:bg-gray-50 transition-colors"
            >
              Aller à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
