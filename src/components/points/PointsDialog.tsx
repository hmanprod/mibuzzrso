'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PointsDialogProps {
  open: boolean;
  onClose: () => void;
  points: number;
}

export default function PointsDialog({ open, onClose, points }: PointsDialogProps) {
  const getRank = (points: number) => {
    if (points >= 1800) return { name: '👑 Légende', color: 'text-yellow-500' };
    if (points >= 800) return { name: '🥇 Or', color: 'text-yellow-400' };
    if (points >= 400) return { name: '🥈 Argent', color: 'text-gray-400' };
    if (points >= 150) return { name: '🥉 Bronze', color: 'text-amber-700' };
    return { name: 'Débutant', color: 'text-gray-600' };
  };

  const currentRank = getRank(points);
  const nextRank = points < 150 ? 150 
    : points < 400 ? 400 
    : points < 800 ? 800 
    : points < 1800 ? 1800 
    : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vos Points et Récompenses</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Colonne gauche */}
          <div className="space-y-6">
            {/* Points actuels et rang */}
            <div className="text-center p-6 bg-gray-50 rounded-lg space-y-3">
              <div className="text-5xl font-bold text-primary">{points}</div>
              <div className={`text-3xl font-semibold ${currentRank.color}`}>
                {currentRank.name}
              </div>
              {nextRank && (
                <div className="text-sm text-gray-600">
                  Plus que {nextRank - points} points pour le prochain niveau
                </div>
              )}
            </div>

            {/* Comment gagner des points */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Comment gagner des points ?</h3>
              <div className="grid gap-2 bg-white rounded-lg border p-4">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Publier une création</span>
                  <span className="font-semibold text-primary">+10 pts</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span>Participer à un challenge</span>
                  <span className="font-semibold text-primary">+25 pts</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Gagner un challenge</span>
                  <span className="font-semibold text-primary">+100 pts</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span>Recevoir un like</span>
                  <span className="font-semibold text-primary">+3 pts</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Recevoir un commentaire</span>
                  <span className="font-semibold text-primary">+5 pts</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span>Commenter une création</span>
                  <span className="font-semibold text-primary">+2 pts</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Partage réseau social</span>
                  <span className="font-semibold text-primary">+5 pts</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span>Inviter un utilisateur actif</span>
                  <span className="font-semibold text-primary">+20 pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Paliers et récompenses</h3>
            <div className="grid gap-3 bg-white rounded-lg border p-4">
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">🥉 Bronze</span>
                  <span className="text-sm text-gray-600">150 pts</span>
                </div>
                <p className="text-sm text-gray-600">Badge + classement hebdomadaire</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">🥈 Argent</span>
                  <span className="text-sm text-gray-600">400 pts</span>
                </div>
                <p className="text-sm text-gray-600">Accès à un sample pack ou défi privé</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">🥇 Or</span>
                  <span className="text-sm text-gray-600">800 pts + Top 1 du mois</span>
                </div>
                <p className="text-sm text-gray-600">Plugin, pack physique ou boost visibilité</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">👑 Légende</span>
                  <span className="text-sm text-gray-600">1800 pts + Top 1 sur 3 mois</span>
                </div>
                <p className="text-sm text-gray-600">Interview, collab spéciale ou gros lot symbolique</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
