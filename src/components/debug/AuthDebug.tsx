'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export function AuthDebug() {
  const { user, profile } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  useEffect(() => {
    const channel = supabase.channel('system')
      .subscribe((status) => {
        setConnectionStatus(status === 'SUBSCRIBED' ? 'online' : 'offline');
      });

    const getSupabaseUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setSupabaseUser(user);
      }
    };

    getSupabaseUser();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (!isVisible || !user) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-800 text-white rounded-lg shadow-lg text-sm max-w-sm z-50 opacity-80">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Fermer"
      >
        <X size={16} />
      </button>
      <div className="flex flex-col gap-2 p-4 bg-dark-800 rounded-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Auth Debug</h3>
        </div>
        <div className="text-sm">
          <p>Connection: <span className={connectionStatus === 'online' ? 'text-green-600' : 'text-red-600'}>{connectionStatus}</span></p>
          <p>User ID: {user?.id}</p>
          <p>Email: {user?.email}</p>
          <p>Profile ID: {profile?.id}</p>
          <div className="mt-2">
            <p className="font-semibold">Raw Supabase User Data:</p>
            <pre className="bg-gray-200 p-2 rounded mt-1 text-xs overflow-auto max-h-40">
              {JSON.stringify(supabaseUser, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
