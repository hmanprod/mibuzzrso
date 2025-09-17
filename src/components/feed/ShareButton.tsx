'use client';

import { useState, useEffect } from 'react';
import { Share, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface ShareButtonProps {
  post: {
    id: string;
    title?: string;
    description?: string;
  };
  mediaItem?: {
    id: string;
  };
  className?: string;
}

export default function ShareButton({ post, mediaItem, className }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isUrlReady, setIsUrlReady] = useState(false);

  const copyToClipboard = async (text: string) => {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.warn('Clipboard API failed, using fallback:', error);
      }
    }
    
    // Fallback method
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    } catch (error) {
      console.error('Fallback copy failed:', error);
      return false;
    }
  };

  const handleCopyLink = async () => {
    // Use pre-generated URL for instant copy
    const success = await copyToClipboard(shareUrl);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Pre-generate referral code on component mount for instant copy
  useEffect(() => {
    const generateInitialUrl = async () => {
      try {
        setIsUrlReady(false);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { generateReferralCode } = await import('@/actions/sharing/referral');
          const referralCode = await generateReferralCode(user.id, post.id);
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const urlWithReferral = `${baseUrl}/post/${post.id}?ref=${referralCode}`;
          setShareUrl(urlWithReferral);
        } else {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          setShareUrl(`${baseUrl}/post/${post.id}`);
        }
        setIsUrlReady(true);
      } catch (error) {
        console.error('Error pre-generating referral code:', error);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        setShareUrl(`${baseUrl}/post/${post.id}`);
        setIsUrlReady(true);
      }
    };
    
    generateInitialUrl();
  }, [post.id]);

  return (
    <div className="relative">
      {/* Bouton principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors",
          className
        )}
        title="Partager"
      >
        <Share className="w-6 h-6" />
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <>
          {/* Overlay pour fermer */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu de partage simplifié */}
          <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-20 min-w-[320px]">
            {/* Instruction */}
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600 mb-1">
                Copiez ce lien et partagez-le sur vos réseaux sociaux
              </p>
              <p className="text-xs text-gray-500">
                Facebook, Instagram, Twitter, WhatsApp, etc.
              </p>
            </div>

            {/* URL Display avec bouton de copie intégré */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-1">Lien du post :</div>
                {!isUrlReady ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <div className="text-sm text-gray-500">Génération du lien...</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 font-mono truncate">{shareUrl}</div>
                )}
              </div>
              
              {/* Bouton de copie */}
              <button
                onClick={handleCopyLink}
                disabled={!isUrlReady}
                className={cn(
                  "flex-shrink-0 p-2 rounded-lg transition-all duration-200",
                  !isUrlReady
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : copied 
                      ? "bg-green-100 text-green-600" 
                      : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                )}
                title={!isUrlReady ? "Génération en cours..." : copied ? "Lien copié !" : "Copier le lien"}
              >
                {copied ? (
                  <Check size={18} className="animate-pulse" />
                ) : (
                  <Copy size={18} />
                )}
              </button>
            </div>

            {/* Message de confirmation */}
            {copied && (
              <div className="mt-2 text-center">
                <span className="text-sm text-green-600 font-medium">
                  ✓ Lien copié ! Vous pouvez maintenant le coller où vous voulez
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
