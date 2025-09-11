'use client';

import { useState } from 'react';
import { Share, Link, MessageCircle, Facebook, Twitter, Check, X, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/post/${post.id}`;
  const shareText = `Découvrez "${post.title || 'cette création'}" sur MiBuzz 🎵`;

  const handleCopyLink = async () => {
    try {
      // Record the share action
      const { recordShare } = await import('@/actions/interactions/interaction');
      await recordShare(post.id, mediaItem?.id, 'copy_link');
      
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      // Fallback pour les navigateurs qui ne supportent pas clipboard
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = async () => {
    try {
      // Record the share action
      const { recordShare } = await import('@/actions/interactions/interaction');
      await recordShare(post.id, mediaItem?.id, 'whatsapp');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du partage:', error);
    }
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Record the share action
        const { recordShare } = await import('@/actions/interactions/interaction');
        await recordShare(post.id, mediaItem?.id, 'native');
        
        await navigator.share({
          title: post.title || 'MiBuzz',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Erreur lors du partage natif:', error);
      }
    }
  };

  const handleFacebookShare = async () => {
    try {
      // Record the share action
      const { recordShare } = await import('@/actions/interactions/interaction');
      await recordShare(post.id, mediaItem?.id, 'facebook');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du partage:', error);
    }
    
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = async () => {
    try {
      // Record the share action
      const { recordShare } = await import('@/actions/interactions/interaction');
      await recordShare(post.id, mediaItem?.id, 'twitter');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du partage:', error);
    }
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

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
          
          {/* Menu de partage */}
          <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-20 min-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <span className="font-semibold text-sm text-gray-800">Partager</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* URL Display */}
            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Lien à partager :</div>
              <div className="text-xs text-gray-700 font-mono break-all">{shareUrl}</div>
            </div>

            {/* Options de partage */}
            <div className="space-y-2">
              {/* Copier le lien */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  copied ? "bg-green-100" : "bg-gray-100"
                )}>
                  {copied ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} className="text-gray-600" />
                  )}
                </div>
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  copied ? "text-green-700" : "text-gray-700"
                )}>
                  {copied ? 'Lien copié !' : 'Copier le lien'}
                </span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle size={16} className="text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                onClick={handleFacebookShare}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xs">f</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Facebook</span>
              </button>

              {/* Twitter */}
              <button
                onClick={handleTwitterShare}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                  <span className="text-sky-600 font-bold text-xs">𝕏</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Twitter</span>
              </button>

              {/* Partage natif (mobile) */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Share size={16} className="text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Partager...</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
