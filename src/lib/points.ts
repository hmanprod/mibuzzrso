export type UserLevel = {
  name: string;
  minPoints: number;
  badge: string; // Emoji ou icône
  color: string; // Couleur Tailwind
};

export const LEVELS: UserLevel[] = [
  { name: 'Débutant', minPoints: 0, badge: '🌱', color: 'text-green-500' },
  { name: 'Amateur', minPoints: 1000, badge: '🎵', color: 'text-blue-500' },
  { name: 'Semi-Pro', minPoints: 1500, badge: '🎸', color: 'text-purple-500' },
  { name: 'Professionnel', minPoints: 2000, badge: '🎼', color: 'text-yellow-500' },
  { name: 'Elite', minPoints: 2500, badge: '👑', color: 'text-red-500' }
];

export function getUserLevel(points: number): UserLevel {
  return [...LEVELS]
    .reverse()
    .find(level => points >= level.minPoints) || LEVELS[0];
}
