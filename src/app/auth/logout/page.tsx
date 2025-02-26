'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/providers/SessionProvider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LogoutPage() {
  const router = useRouter();
  const { user } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const supabase = createClientComponentClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error during logout:', error);
        return;
      }

      router.push('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Se déconnecter
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Êtes-vous sûr de vouloir vous déconnecter ?
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <Button
            onClick={handleLogout}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LogOut className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
          </Button>
        </div>
      </div>
    </div>
  );
}
