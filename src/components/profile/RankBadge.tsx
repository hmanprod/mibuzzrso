import { getRankInfo } from '@/lib/points';

interface RankBadgeProps {
  points: number;
}

export default function RankBadge({ points }: RankBadgeProps) {
  const rankInfo = getRankInfo(points);

  return (
    <div className={`flex items-center pl-1 ${rankInfo.color} font-medium`}>
      <span className="text-xl">{rankInfo.icon}</span>
      {/* <span>{rankInfo.name}</span> */}
    </div>
  );
}
