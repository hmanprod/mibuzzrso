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
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Vos Points et Récompenses</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 py-4">
          {/* Colonne gauche */}
          <div className="space-y-6">
            {/* Points actuels et rang */}
            <div className="text-center p-4 sm:p-6 bg-gray-50 rounded-lg space-y-3">
              <div className="text-3xl sm:text-5xl font-bold text-primary">{points}</div>
              <div className={`text-xl sm:text-3xl font-semibold ${currentRank.color}`}>
                {currentRank.name}
              </div>
              {nextLevelPoints && (
                <div className="text-xs sm:text-sm text-gray-600">
                  Plus que {nextLevelPoints - points} points pour le prochain niveau
                </div>
              )}
            </div>

            {/* Comment gagner des points */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base sm:text-lg">Comment gagner des points ?</h3>
              <div className="grid gap-2 bg-white rounded-lg border p-3 sm:p-4">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span>Publier une création</span>
                  <span className="font-semibold text-primary">+10 pts</span>
                </div>
                <div className="flex justify-between items-center p-2 text-sm">
                  <span>Participer à un challenge</span>
                  <span className="font-semibold text-primary">+13 pts</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span>Gagner un challenge</span>
                  <span className="font-semibold text-primary">+100 pts</span>
                </div>
                <div className="flex justify-between items-center p-2 text-sm">
                  <span>Recevoir un like</span>
                  <span className="font-semibold text-primary">+2 pts</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span>Recevoir un commentaire</span>
                  <span className="font-semibold text-primary">+3 pts</span>
                </div>
                <div className="flex justify-between items-center p-2 text-sm">
                  <span>Commenter une création</span>
                  <span className="font-semibold text-primary">+2 pts</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span>Partager une création</span>
                  <span className="font-semibold text-primary">+5 pts</span>
                </div>
                <div className="flex justify-between items-center p-2 text-sm">
                  <span>Parrainage (visite de lien)</span>
                  <span className="font-semibold text-primary">+1 pt</span>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base sm:text-lg">Paliers et récompenses</h3>
            <div className="grid gap-2 sm:gap-3 bg-white rounded-lg border p-3 sm:p-4 max-h-[400px] overflow-y-auto">
              {LEVELS.map((level, index) => (
                <div key={index} className="p-2 sm:p-3 border rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-lg sm:text-2xl flex-shrink-0">{level.badge}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm sm:text-base ${level.color}`}>
                        {level.name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {level.minPoints} points
                      </div>
                    </div>
                    {points >= level.minPoints && (
                      <div className="text-green-500 font-semibold text-xs sm:text-sm flex-shrink-0">
                        ✓ Atteint
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
