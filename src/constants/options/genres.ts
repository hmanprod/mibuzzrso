import { Option } from "@/components/ui/multi-select";

export const MUSICAL_INTERESTS: Option[] = [
  { label: 'Afro', value: 'afro' },
  { label: 'Hip-Hop', value: 'hip_hop' },
  { label: 'R&B', value: 'r_and_b' },
  { label: 'Pop', value: 'pop' },
  { label: 'Rock', value: 'rock' },
  { label: 'Électronique', value: 'electronic' },
  { label: 'Jazz', value: 'jazz' },
  { label: 'Classique', value: 'classical' },
];

// Helper function to get label from value
export const getGenreLabel = (value: string): string => {
  const genre = MUSICAL_INTERESTS.find(g => g.value === value);
  return genre?.label || value;
};

// Badge color for musical interests
export const GENRE_BADGE_COLOR = "bg-purple-100 text-purple-800";

// Optional: Create a type for the values
export type GenreValue = typeof MUSICAL_INTERESTS[number]['value'];
