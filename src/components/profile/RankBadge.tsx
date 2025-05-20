

interface RankBadgeProps {
  points: number;
}

export default function RankBadge({ points }: RankBadgeProps) {
  const getRankInfo = (points: number) => {
    if (points >= 1800) {
      return {
        name: 'Légende',
        icon: '👑',
        color: 'text-purple-600'
      };
    }
    if (points >= 800) {
      return {
        name: 'Or',
        icon: '🥇',
        color: 'text-yellow-500'
      };
    }
    if (points >= 400) {
      return {
        name: 'Argent',
        icon: '🥈',
        color: 'text-gray-400'
      };
    }
    if (points >= 150) {
      return {
        name: 'Bronze',
        icon: '🥉',
        color: 'text-amber-600'
      };
    }
    return null;
  };

  const rankInfo = getRankInfo(points);

  if (!rankInfo) return null;

  return (
    <div className={`flex items-center pl-1 ${rankInfo.color} font-medium`}>
      <span className="text-xl">{rankInfo.icon}</span>
      {/* <span>{rankInfo.name}</span> */}
    </div>
  );
}
