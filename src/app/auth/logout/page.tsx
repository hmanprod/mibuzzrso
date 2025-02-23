'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function LogoutPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    console.log('handleLogout');
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Error during logout:', error);
        return;
      }
      router.replace('/auth/login');
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          Voulez-vous vraiment vous déconnecter ?
        </h1>
        <Button
          onClick={handleLogout}
          disabled={isLoading}
          size="lg"
          className="gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Déconnexion...
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
