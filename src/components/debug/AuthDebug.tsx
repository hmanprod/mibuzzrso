'use client';

import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';

export function AuthDebug() {
  const { user, profile } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsVisible(true);
    // const hidden = localStorage.getItem('hide-auth-debug') === 'true';
    // setIsVisible(!hidden);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hide-auth-debug', 'true');
  };

  if (!mounted || !isVisible) return null;

  return (
    <>
      <div className="fixed bottom-20 right-4 z-[9999]">
        <div className="bg-black/50 backdrop-blur-sm rounded-full shadow-lg border border-gray-800/20 px-3 py-1.5 flex items-center gap-2 text-[12px] text-white/80 font-medium">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span>{user ? 'Authenticated' : 'Not Authenticated'}</span>
          </div>
          <div className="h-3 w-[1px] bg-white/20" />
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Show debug details"
          >
            <Info className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Hide auth debug indicator"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999]">
          <div className="bg-black/75 text-white/90 rounded-t-lg sm:rounded-lg shadow-xl max-w-lg w-full sm:mx-4 sm:max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 backdrop-blur-sm bg-black/50">
              <h3 className="font-medium">Auth Debug</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-6 text-sm">
              <section>
                <h4 className="text-[11px] font-medium uppercase tracking-wider text-white/50 mb-3">User</h4>
                <div className="space-y-2 text-[13px]">
                  <p><span className="text-white/50">ID:</span> {user?.id}</p>
                  <p><span className="text-white/50">Email:</span> {user?.email}</p>
                  <p>
                    <span className="text-white/50">Last Sign In:</span>{' '}
                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </section>

              {profile && (
                <section>
                  <h4 className="text-[11px] font-medium uppercase tracking-wider text-white/50 mb-3">Profile</h4>
                  <div className="space-y-2 text-[13px]">
                    <p><span className="text-white/50">ID:</span> {profile.id}</p>
                    <p><span className="text-white/50">Stage Name:</span> {profile.stage_name || 'Not set'}</p>
                    <p>
                      <span className="text-white/50">Created:</span>{' '}
                      {profile.created_at ? new Date(profile.created_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
