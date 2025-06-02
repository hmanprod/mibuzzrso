'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import AudioPlayer from '@/components/feed/AudioPlayer';
import VideoPlayer from '@/components/feed/VideoPlayer';

interface JuryVoteModalProps {
  open: boolean;
  onClose: () => void;
  onVote: (criteria: VoteCriteria) => Promise<void>;
  participation: {
    id: string;
    medias: Array<{
      id: string;
      media: {
        id: string;
        media_type: 'audio' | 'video';
        media_url: string;
      };
    }>;
  };
}

interface VoteCriteria {
  technique: number;
  originalite: number;
  interpretation: number;
  overall: number;
}

const RATINGS = [
  { value: 0, label: 'Très insuffisant', description: 'Niveau très faible, nombreux défauts majeurs' },
  { value: 1, label: 'Insuffisant', description: 'En dessous des attentes, défauts importants' },
  { value: 2, label: 'Moyen', description: 'Niveau basique, quelques points positifs' },
  { value: 3, label: 'Bon', description: 'Bon niveau, performance solide' },
  { value: 4, label: 'Très bon', description: 'Très bonne performance, quelques points d\'excellence' },
  { value: 5, label: 'Excellent', description: 'Performance exceptionnelle, remarquable' },
];

const INITIAL_CRITERIA: VoteCriteria = {
  technique: 0,
  originalite: 0,
  interpretation: 0,
  overall: 0,
};

export default function JuryVoteModal({ open, onClose, onVote, participation }: JuryVoteModalProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [hasListenedFully, setHasListenedFully] = useState(false);
  const [criteria, setCriteria] = useState<VoteCriteria>(INITIAL_CRITERIA);

  // Calcul automatique de la note globale (0-5)
  useEffect(() => {
    const { ...otherCriteria } = criteria;
    const sum = Object.values(otherCriteria).reduce((acc, value) => acc + value, 0);
    const average = sum / 3;
    const roundedAverage = Math.round(average);
    
    if (roundedAverage !== criteria.overall) {
      setCriteria(prev => ({
        ...prev,
        overall: roundedAverage
      }));
    }
  }, [criteria.technique, criteria.originalite, criteria.interpretation, criteria]);

  const handleCriteriaChange = (criterionName: keyof VoteCriteria) => (value: number[]) => {
    if (criterionName !== 'overall') { // Empêcher la modification directe de overall
      setCriteria(prev => ({
        ...prev,
        [criterionName]: value[0]
      }));
    }
  };

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
      await onVote(criteria);
      toast({
        title: "Vote jury enregistré !",
        description: "Merci d'avoir évalué cette participation",
      });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du vote",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  const criteriaConfig = [
    {
      name: 'technique' as const,
      label: 'Technique',
      description: 'Qualité technique et maîtrise de l\'instrument/voix',
      editable: true,
      helpText: 'Notez la maîtrise technique de l\'artiste'
    },
    {
      name: 'originalite' as const,
      label: 'Originalité',
      description: 'Créativité et innovation dans l\'approche',
      editable: true,
      helpText: 'Évaluez l\'originalité et la créativité'
    },
    {
      name: 'interpretation' as const,
      label: 'Interprétation',
      description: 'Expression et ressenti émotionnel',
      editable: true,
      helpText: 'Jugez la qualité de l\'interprétation'
    },
    {
      name: 'overall' as const,
      label: 'Note globale',
      description: 'Moyenne des trois critères ci-dessus',
      editable: false,
      helpText: 'Calculée automatiquement'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Vote jury</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lecteur média */}
          {participation.medias.map((media) => (
            <div key={media.id}>
              {media.media.media_type === 'audio' ? (
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
                />
              ) : (
                <VideoPlayer
                  mediaId={media.media.id}
                  postId={participation.id}
                  videoUrl={media.media.media_url}
                  comments={[]}
                  onTimeUpdate={(time: number) => {
                    const video = document.querySelector('video');
                    if (video && time >= video.duration) {
                      setHasListenedFully(true);
                    }
                  }}
                  downloadable={false}
                />
              )}
            </div>
          ))}

          {!hasListenedFully && (
            <p className="text-red-500">
              Écoutez la participation jusqu&apos;à la fin pour pouvoir voter
            </p>
          )}

          {/* Critères de vote */}
          <div className="space-y-4">
            {criteriaConfig.map((criterion) => (
              <div key={criterion.name} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <Label className="text-base font-medium block">
                      {criterion.label}
                    </Label>
                    <p className="text-xs text-gray-500">{criterion.description}</p>
                  </div>
                  <span className="text-xl font-bold text-[#E94135] ml-4">
                    {criteria[criterion.name]}/5
                  </span>
                </div>
                
                {criterion.editable ? (
                  <div className="flex gap-1 mt-2">
                    {RATINGS.map((rating) => (
                      <button
                        key={rating.value}
                        onClick={() => handleCriteriaChange(criterion.name)([rating.value])}
                        disabled={!hasListenedFully || isVoting}
                        title={rating.description}
                        className={`flex-1 py-2 px-1 rounded transition-all text-center ${criteria[criterion.name] === rating.value
                          ? 'bg-[#E94135] text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        } ${!hasListenedFully || isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-sm font-medium">{rating.value}</div>
                        <div className="text-xs">{rating.label}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-100 p-2 rounded mt-2">
                    <div className="text-sm">
                      <span className="text-[#E94135] font-medium">{RATINGS[criteria[criterion.name]]?.label}</span>
                      <span className="text-gray-500 text-xs ml-2">{criterion.helpText}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isVoting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleVote}
              disabled={!hasListenedFully || isVoting}
              className="bg-[#E94135] text-white hover:bg-red-600"
            >
              {isVoting ? 'Vote en cours...' : 'Soumettre le vote'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
