'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LEVELS, getUserLevel, getPointsForNextLevel } from '@/lib/points';

interface PointsDialogProps {
  open: boolean;
  onClose: () => void;
  points: number;
}

export default function PointsDialog({ open, onClose, points }: PointsDialogProps) {
  const currentLevel = getUserLevel(points);
  const nextLevelPoints = getPointsForNextLevel(points);
  
  // Formatage pour l'affichage
  const currentRank = {
    name: `${currentLevel.badge} ${currentLevel.name}`,
    color: currentLevel.color
  };

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
              {nextLevelPoints && (
                <div className="text-sm text-gray-600">
                  Plus que {nextLevelPoints - points} points pour le prochain niveau
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
                  <span className="font-semibold text-primary">+13 pts</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Gagner un challenge</span>
                  <span className="font-semibold text-primary">+100 pts</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span>Recevoir un like</span>
                  <span className="font-semibold text-primary">+2 pts</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Recevoir un commentaire</span>
                  <span className="font-semibold text-primary">+3 pts</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span>Commenter une création</span>
                  <span className="font-semibold text-primary">+2 pts</span>
                </div>
                {/* <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Partage réseau social</span>
                  <span className="font-semibold text-primary">+5 pts</span>
                </div> */}
                <div className="flex justify-between items-center p-2">
                  <span>Inviter un utilisateur actif</span>
                  <span className="font-semibold text-primary">+10 pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Paliers et récompenses</h3>
            <div className="grid gap-3 bg-white rounded-lg border p-4">
              {LEVELS.map((level, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{level.badge} {level.name}</span>
                    <span className="text-sm text-gray-600">
                      {level.maxPoints 
                        ? `${level.minPoints}-${level.maxPoints} pts` 
                        : `${level.minPoints}+ pts`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{level.rewards}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
