'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestMagicLink() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClientComponentClient();

  const handleMagicLink = async () => {
    try {
      setLoading(true);
      setMessage('');

      const {  error } = await supabase.auth.signInWithOtp({
        email: 'randrianomendrayarn@gmail.com',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setMessage('✅ Lien magique envoyé ! Vérifiez votre email.');
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors de l\'envoi du lien magique.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Test Magic Link
        </h1>
        
        <p className="text-center text-gray-600">
          Email cible : randrianomendrayarn@gmail.com
        </p>

        <div className="flex justify-center">
          <Button
            onClick={handleMagicLink}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le Magic Link'}
          </Button>
        </div>

        {message && (
          <p className="text-center mt-4 font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
