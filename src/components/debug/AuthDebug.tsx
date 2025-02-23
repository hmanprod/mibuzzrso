'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export function AuthDebug() {
  const { user, profile } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    const channel = supabase.channel('system')
      .subscribe((status) => {
        setConnectionStatus(status === 'SUBSCRIBED' ? 'online' : 'offline');
      });

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
      <div className="flex flex-col gap-1 pr-4">
        <p className="font-semibold">Debug Info:</p>
        <p>User: {user.email}</p>
        {profile && (
          <>
            <p>Name: {profile.stage_name || 'N/A'}</p>
          </>
        )}
        <p>Supabase: <span className={connectionStatus === 'online' ? 'text-green-400' : 'text-red-400'}>{connectionStatus}</span></p>
      </div>
    </div>
  );
}
