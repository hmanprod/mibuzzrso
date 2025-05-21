export type UserLevel = {
  name: string;
  minPoints: number;
  badge: string; // Emoji ou icône
  color: string; // Couleur Tailwind
};

export const LEVELS: UserLevel[] = [
  { name: 'Bronze', minPoints: 0, badge: '🥉', color: 'text-amber-700' },
  { name: 'Argent', minPoints: 150, badge: '🥈', color: 'text-gray-400' },
  { name: 'Or', minPoints: 400, badge: '🥇', color: 'text-yellow-400' },
  { name: 'Maitre', minPoints: 800, badge: '🏆', color: 'text-yellow-400' },
  { name: 'Légende', minPoints: 1800, badge: '👑', color: 'text-yellow-500' }
];

export function getUserLevel(points: number): UserLevel {
  return [...LEVELS]
    .reverse()
    .find(level => points >= level.minPoints) || LEVELS[0];
}
