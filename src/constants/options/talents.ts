import { Option } from "@/components/ui/multi-select";

export const TALENTS: Option[] = [
  { label: 'DJ', value: 'dj' },
  { label: 'Producteur', value: 'producer' },
  { label: 'Beatmaker', value: 'beatmaker' },
  { label: 'Chanteur', value: 'singer' },
  { label: 'Rappeur', value: 'rapper' },
  { label: 'Musicien', value: 'musician' },
  { label: 'Groupe', value: 'bands' },
  { label: 'Ingénieur Son', value: 'sound_engineer' },
  { label: 'Programmateur musical', value: 'curator' },
  { label: 'Manageur', value: 'manager' },
];

// Helper function to get label from value
export const getTalentLabel = (value: string): string => {
  const talent = TALENTS.find(t => t.value === value);
  return talent?.label || value;
};

// Badge color for talents
export const TALENT_BADGE_COLOR = "bg-blue-100 text-blue-800";

// Optional: Create a type for the values
export type TalentValue = typeof TALENTS[number]['value'];
