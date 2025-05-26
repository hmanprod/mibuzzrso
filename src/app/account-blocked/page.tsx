'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function BlockedAccount() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const blockTime = localStorage.getItem('blockTime');
    if (!blockTime) {
      localStorage.setItem('blockTime', Date.now().toString());
    }

    const timer = setTimeout(async () => {
      await supabase.auth.signOut();
      router.push('/auth/login');
    }, 10000);

    return () => clearTimeout(timer);
  }, [router, supabase.auth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Compte bloqué</h2>
          <p className="mt-2 text-sm text-gray-600">
            Votre compte a été temporairement bloqué. Veuillez contacter les administrateurs.
          </p>
          <p className="mt-4 text-sm text-red-600">
            Vous serez déconnecté dans quelques secondes...
          </p>
        </div>
      </div>
    </div>
  );
}
