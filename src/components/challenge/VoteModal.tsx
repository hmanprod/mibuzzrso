import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface VoteModalProps {
  open: boolean;
  onClose: () => void;
  onVote: (points: number) => Promise<void>;
  participation: {
    id: string;
    medias: Array<{
      id: string;
      media: {
        id: string;
        media_type: 'audio' | 'video';
        media_url: string;
        media_cover_url?: string;
      };
    }>;
  };
}

import AudioPlayer from '@/components/feed/AudioPlayer';

export default function VoteModal({ open, onClose, onVote, participation }: VoteModalProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [hasListenedFully, setHasListenedFully] = useState(false);

  if (!open) return null;

  const handleVote = async () => {
    if (!hasListenedFully) {
      toast({
        title: "Impossible de voter",
        description: "Vous devez écouter la participation jusqu'à la fin avant de pouvoir voter",
        variant: "destructive",
      });
      return;
    }



    setIsVoting(true);
    try {
      await onVote(1); // Vote fixé à 1 point
      toast({
        title: "Vote enregistré !",
        description: "Merci d'avoir voté pour cette participation",
      });
      onClose();
    } catch (error) {
      console.log(error);
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du vote",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[18px] p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Voter pour cette participation</h3>
        
        {/* Audio player */}
        {participation.medias.map((media) => (
          media.media.media_type === 'audio' && (
            <div key={media.id} className="mb-6">
              <AudioPlayer
                mediaId={media.media.id}
                postId={participation.id}
                audioUrl={media.media.media_url}
                comments={[]}
                onTimeUpdate={(time: number) => {
                  const audio = document.querySelector('audio');
                  if (audio && time >= audio.duration) {
                    setHasListenedFully(true);
                  }
                }}
                downloadable={false}
                coverUrl={media.media.media_cover_url}
              />
            </div>
          )
        ))}

        {!hasListenedFully ? (
          <p className="text-red-500 mb-4">
            Écoutez la participation jusqu&apos;à la fin pour pouvoir voter
          </p>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <Star className="w-8 h-8 fill-yellow-400 stroke-yellow-400" />
            </div>
            <p className="text-sm text-gray-600">
              Voter pour 1 point
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isVoting}
          >
            Annuler
          </button>
          <button
            onClick={handleVote}
            disabled={!hasListenedFully || isVoting}
            className="px-4 py-2 bg-[#E94135] text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVoting ? 'Vote en cours...' : 'Voter'}
          </button>
        </div>
      </div>
    </div>
  );
}
