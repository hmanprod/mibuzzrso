import { getUserLevel } from '@/lib/points';

type UserLevelProps = {
  points: number;
};

export default function UserLevel({ points }: UserLevelProps) {
  const level = getUserLevel(points);
  const nextLevel = level.name !== 'Elite' 
    ? getUserLevel(level.minPoints + 1) 
    : null;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{level.badge}</span>
        <div>
          <h3 className={`font-semibold ${level.color}`}>{level.name}</h3>
          <p className="text-sm text-gray-600">{points} points</p>
        </div>
      </div>
      
      {nextLevel && (
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
      )}
    </div>
  );
}
