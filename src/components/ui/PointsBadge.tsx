interface PointsBadgeProps {
  points: number;
}

export default function PointsBadge({ points }: PointsBadgeProps) {
  return (
    <div className="px-2 py-0.5 rounded-full text-sm font-medium text-gray-700">
      {points} pts
    </div>
  );
}
