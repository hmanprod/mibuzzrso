'use client';

import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export function AuthDebug() {
  const { user, profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [cookieData, setCookieData] = useState<string[]>([]);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);

  // Initialize Supabase client after mount
  useEffect(() => {
    setMounted(true);
    setSupabase(createClient());
  }, []);

  // Handle localStorage after mount
  useEffect(() => {
    if (!mounted) return;
    
    const hidden = localStorage.getItem('hide-auth-debug');
    if (hidden) {
      const expiry = JSON.parse(hidden).expiry;
      if (expiry > Date.now()) {
        setIsVisible(false);
      }
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !supabase) return;

    const channel = supabase.channel('system')
      .subscribe((status) => {
        setConnectionStatus(status === 'SUBSCRIBED' ? 'online' : 'offline');
      });

    const getAuthData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('AuthDebug getUser error:', userError);
        } else {
          setSupabaseUser(user);
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('AuthDebug getSession error:', sessionError);
          setSessionData(null);
        } else {
          setSessionData(session);
        }

        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';').map(c => c.trim());
          const authCookies = cookies.filter(c => 
            c.startsWith('sb-') || 
            c.startsWith('supabase-') || 
            c.includes('auth')
          );
          setCookieData(authCookies);
        }
      } catch (error) {
        console.error('AuthDebug getData error:', error);
      }
    };

    getAuthData();
    const interval = setInterval(getAuthData, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [supabase, mounted]);

  const hideIndicator = () => {
    if (!mounted) return;
    setIsVisible(false);
    localStorage.setItem('hide-auth-debug', JSON.stringify({
      expiry: Date.now() + 1000 * 60 * 60 // 1 hour
    }));
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) return null;
  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{user ? 'Authenticated' : 'Not Authenticated'}</span>
          </div>
          <button
            onClick={() => setShowDetails(true)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            aria-label="Show debug details"
          >
            <Info size={14} />
          </button>
          <button
            onClick={hideIndicator}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            aria-label="Hide auth debug indicator"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="font-semibold text-lg">Auth Debug Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                aria-label="Close details"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <section>
                <h4 className="font-medium mb-2">Context User</h4>
                <div className="space-y-1">
                  <p>ID: {user?.id}</p>
                  <p>Email: {user?.email}</p>
                  <p>Last Sign In: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
                </div>
              </section>

              <section>
                <h4 className="font-medium mb-2">Profile</h4>
                <div className="space-y-1">
                  <p>ID: {profile?.id}</p>
                  <p>Created: {profile?.created_at ? new Date(profile.created_at).toLocaleString() : 'N/A'}</p>
                </div>
              </section>

              <section>
                <h4 className="font-medium mb-2">Session Status</h4>
                <div className="space-y-1">
                  <p>Active: {sessionData ? 'Yes' : 'No'}</p>
                  {sessionData && (
                    <p>Expires: {new Date(sessionData.expires_at! * 1000).toLocaleString()}</p>
                  )}
                </div>
              </section>

              <section>
                <h4 className="font-medium mb-2">Auth Cookies</h4>
                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs space-y-1">
                  {cookieData.map((cookie, i) => (
                    <p key={i} className="break-all">{cookie}</p>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="font-medium mb-2">Raw Supabase User</h4>
                <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(supabaseUser, null, 2)}
                </pre>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
