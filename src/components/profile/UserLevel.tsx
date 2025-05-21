import { getUserLevel } from '@/lib/points';
import PointsBadge from '../ui/PointsBadge';
import RankBadge from './RankBadge';

type UserLevelProps = {
  points: number;
};

export default function UserLevel({ points }: UserLevelProps) {
  const level = getUserLevel(points);
  const nextLevel = level.name !== 'Elite' 
    ? getUserLevel(level.minPoints + 1) 
    : null;

  return (
    <div className="max-w-[200px]">
      {/* <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{level.badge}</span>
        <div>
          <h3 className={`font-semibold ${level.color}`}>{level.name}</h3>
          <p className="text-sm text-gray-600">{points} points</p>
        </div>
      </div> */}

      <div className="flex gap-0.5 bg-primary/80 rounded-full text-white p-1 pr-3">
        {/* {profile?.points !== undefined && profile.points > 0 && ( */}
          <PointsBadge points={points || 0} />
        {/* )} */}
        {points !== undefined && points >= 150 && (
          <RankBadge points={points} />
        )}
      </div>
      
      {/* {nextLevel && (
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">
            Prochain niveau : {nextLevel.name} {nextLevel.badge}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${level.color}`}
              style={{
                width: `${Math.min(100, ((points - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100)}%`
              }}
            />
          </div>
        </div>
      )} */}
    </div>
  );
}
