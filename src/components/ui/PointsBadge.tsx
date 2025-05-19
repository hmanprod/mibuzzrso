interface PointsBadgeProps {
  points: number;
}

export default function PointsBadge({ points }: PointsBadgeProps) {
  return (
    <div className="px-2 py-0.5 rounded-full text-sm font-medium text-black">
      {points} points
    </div>
  );
}
