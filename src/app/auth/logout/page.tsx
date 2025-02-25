'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function LogoutPage() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Redirect to login if not authenticated
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user, router, mounted]);

  const handleLogout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Error during logout:', error);
        return;
      }
      
      // Clear any local storage items
      localStorage.removeItem('hide-auth-debug');
      
      // Redirect to login page
      router.replace('/auth/login');
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything until mounted and user is authenticated
  if (!mounted || !user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          Are you sure you want to sign out?
        </h1>
        <p className="text-muted-foreground">
          You will need to sign in again to access your account.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogout}
            disabled={isLoading}
            variant="destructive"
            size="default"
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
