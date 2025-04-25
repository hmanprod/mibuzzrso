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

  // Utiliser useEffect pour la redirection
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

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

  // Ne rien afficher si pas d'utilisateur
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Déconnexion
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
            {isLoading ? (
              'Déconnexion en cours...'
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
