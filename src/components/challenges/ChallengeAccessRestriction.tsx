'use client';

import { useState } from 'react';
import { Lock, Star } from 'lucide-react';
import { getSilverLevel } from '@/lib/points';
import PointsDialog from '@/components/points/PointsDialog';

interface ChallengeAccessRestrictionProps {
  userPoints: number;
  children: React.ReactNode;
}

export default function ChallengeAccessRestriction({ 
  userPoints, 
  children 
}: ChallengeAccessRestrictionProps) {
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const silverLevel = getSilverLevel();
  const pointsNeeded = silverLevel.minPoints - userPoints;

  // Si l'utilisateur a accès, afficher le contenu normal
  if (userPoints >= silverLevel.minPoints) {
    return <>{children}</>;
  }

  // Sinon, afficher le message de restriction
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 text-center space-y-6">
        {/* Icône de verrouillage */}
        <div className="flex justify-center">
          <div className="bg-gray-200 rounded-full p-4">
            <Lock size={48} className="text-gray-600" />
          </div>
        </div>

        {/* Titre */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-800">
            Accès aux challenges verrouillé
          </h1>
          <p className="text-gray-600">
            Les challenges sont réservés aux utilisateurs du palier{' '}
            <span className="font-semibold text-gray-700">
              {silverLevel.badge} {silverLevel.name}
            </span>{' '}
            et plus.
          </p>
        </div>

        {/* Informations sur les points */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Star className="text-yellow-500" size={24} />
            <span className="text-lg font-semibold">
              Vos points actuels : {userPoints}
            </span>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Il vous faut encore{' '}
              <span className="font-bold text-red-500">{pointsNeeded} points</span>{' '}
              pour débloquer les challenges
            </p>
            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-400 to-red-500 h-full transition-all duration-300"
                style={{ width: `${Math.min((userPoints / silverLevel.minPoints) * 100, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {userPoints} / {silverLevel.minPoints} points
            </p>
          </div>
        </div>

        {/* Bouton pour voir comment gagner des points */}
        <button
          onClick={() => setShowPointsDialog(true)}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Comment gagner des points ?
        </button>

        {/* Récompenses du palier Argent */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-2">
            🥈 Récompenses du palier Argent
          </h3>
          <p className="text-sm text-gray-600">
            {silverLevel.rewards}
          </p>
        </div>
      </div>

      {/* Modal des points */}
      <PointsDialog
        open={showPointsDialog}
        onClose={() => setShowPointsDialog(false)}
        points={userPoints}
      />
    </div>
  );
}
