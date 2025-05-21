export type UserLevel = {
  name: string;
  minPoints: number;
  maxPoints?: number;
  badge: string; // Emoji ou icône
  color: string; // Couleur Tailwind
  rewards: string; // Récompenses associées à ce niveau
};

export const LEVELS: UserLevel[] = [
  { 
    name: 'Bronze', 
    minPoints: 0, 
    maxPoints: 149,
    badge: '🥉', 
    color: 'text-amber-700',
    rewards: 'Badge + classement hebdomadaire'
  },
  { 
    name: 'Argent', 
    minPoints: 150, 
    maxPoints: 399,
    badge: '🥈', 
    color: 'text-gray-400',
    rewards: 'Accès à un sample pack ou défi privé'
  },
  { 
    name: 'Or', 
    minPoints: 400, 
    maxPoints: 799,
    badge: '🥇', 
    color: 'text-yellow-400',
    rewards: 'Plugin, pack physique ou boost visibilité'
  },
  { 
    name: 'Maitre', 
    minPoints: 800, 
    maxPoints: 1799,
    badge: '🏆', 
    color: 'text-yellow-400',
    rewards: 'Accès prioritaire aux événements + mentorat'
  },
  { 
    name: 'Légende', 
    minPoints: 1800, 
    badge: '👑', 
    color: 'text-yellow-500',
    rewards: 'Interview, collab spéciale ou gros lot symbolique'
  }
];

/**
 * Retourne le niveau de l'utilisateur en fonction de ses points
 */
export function getUserLevel(points: number): UserLevel {
  return [...LEVELS]
    .reverse()
    .find(level => points >= level.minPoints) || LEVELS[0];
}

/**
 * Retourne le nombre de points nécessaires pour atteindre le niveau suivant
 */
export function getPointsForNextLevel(points: number): number | null {
  const currentLevel = getUserLevel(points);
  const currentLevelIndex = LEVELS.findIndex(level => level.name === currentLevel.name);
  
  // Si c'est le dernier niveau, il n'y a pas de niveau suivant
  if (currentLevelIndex === LEVELS.length - 1) {
    return null;
  }
  
  return LEVELS[currentLevelIndex + 1].minPoints;
}

/**
 * Retourne les informations de rang pour l'affichage du badge
 */
export function getRankInfo(points: number) {
  const level = getUserLevel(points);
  return {
    name: level.name,
    icon: level.badge,
    color: level.color
  };
}
