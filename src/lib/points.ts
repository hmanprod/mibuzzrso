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
    maxPoints: 49,
    badge: '🥉', 
    color: 'text-amber-700',
    rewards: 'Badge + classement hebdomadaire'
  },
  { 
    name: 'Argent', 
    minPoints: 50, 
    maxPoints: 599,
    badge: '🥈', 
    color: 'text-gray-400',
    rewards: 'Accès aux challenges + sample pack offert'
  },
  { 
    name: 'Or', 
    minPoints: 600, 
    maxPoints: 1699,
    badge: '🥇', 
    color: 'text-yellow-400',
    rewards: 'Accès aux challenges privés + Plugin offert'
  },
  { 
    name: 'Maitre', 
    minPoints: 1700, 
    maxPoints: 3799,
    badge: '🏆', 
    color: 'text-yellow-400',
    rewards: 'Télechargement illimit + Accès prioritaire aux événements mibuzz + goodies exclusifs'
  },
  { 
    name: 'Légende', 
    minPoints: 4800, 
    badge: '👑', 
    color: 'text-yellow-500',
    rewards: 'Collab spéciale + Interview + boost visibilité + gros lot symbolique + goodies exclusifs'
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

/**
 * Vérifie si l'utilisateur a accès aux challenges (palier Argent minimum)
 */
export function hasAccessToChallenges(points: number): boolean {
  return points >= 50; // Palier Argent minimum
}

/**
 * Retourne le palier Argent pour l'affichage des restrictions
 */
export function getSilverLevel(): UserLevel {
  return LEVELS.find(level => level.name === 'Argent') || LEVELS[1];
}
