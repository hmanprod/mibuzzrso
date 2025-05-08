import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { Trophy } from 'lucide-react';

interface WinnerCardProps {
  winnerDisplayName: string;
  show: boolean;
}

const WinnerCard: React.FC<WinnerCardProps> = ({ winnerDisplayName, show }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (show) {
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="relative rounded-[24px] p-6 mb-6 flex items-center gap-5 animate-fade-in">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <Confetti width={typeof window !== 'undefined' ? window.innerWidth : 300} height={300} recycle={false} numberOfPieces={300} />
        </div>
      )}
      <div className="flex-shrink-0 z-20">
        <Trophy size={48} className="text-yellow-500 animate-bounce drop-shadow-lg" />
      </div>
      <div className="z-20">
        <div className="text-2xl font-extrabold text-yellow-900 flex items-center gap-2">
          <span className="animate-pulse">👑</span>
          Félicitations à notre gagnant
          <span className="animate-pulse">🎉</span>
        </div>
        <div className="text-3xl font-black text-red-500 drop-shadow-md animate-fade-in-up mt-2">
          {winnerDisplayName}
        </div>
      </div>
    </div>
  );
};

export default WinnerCard;
