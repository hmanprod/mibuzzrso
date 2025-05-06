import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  // Initialiser le state avec la valeur du localStorage si elle existe
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem('mibuzz_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        localStorage.setItem('mibuzz_user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('mibuzz_user');
      }
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        localStorage.setItem('mibuzz_user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('mibuzz_user');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return { user, loading };
}
