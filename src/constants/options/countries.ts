import { Option } from "@/components/ui/multi-select";

export const INDIAN_OCEAN_COUNTRIES: Option[] = [
  { label: 'Madagascar', value: 'madagascar' },
  { label: 'Comores', value: 'comoros' },
  { label: 'La Réunion', value: 'reunion' },
  { label: 'Maurice', value: 'mauritius' },
  { label: 'Mayotte', value: 'mayotte' },
];

// Liste complète des pays
export const ALL_COUNTRIES: Option[] = [
  ...INDIAN_OCEAN_COUNTRIES,
  { label: 'Afrique du Sud', value: 'south_africa' },
  { label: 'Algérie', value: 'algeria' },
  { label: 'Angola', value: 'angola' },
  { label: 'Bénin', value: 'benin' },
  { label: 'Botswana', value: 'botswana' },
  { label: 'Burkina Faso', value: 'burkina_faso' },
  { label: 'Burundi', value: 'burundi' },
  { label: 'Cameroun', value: 'cameroon' },
  { label: 'Cap-Vert', value: 'cape_verde' },
  { label: 'Congo', value: 'congo' },
  { label: 'Côte d\'Ivoire', value: 'ivory_coast' },
  { label: 'Djibouti', value: 'djibouti' },
  { label: 'Égypte', value: 'egypt' },
  { label: 'Érythrée', value: 'eritrea' },
  { label: 'Éthiopie', value: 'ethiopia' },
  { label: 'Gabon', value: 'gabon' },
  { label: 'Gambie', value: 'gambia' },
  { label: 'Ghana', value: 'ghana' },
  { label: 'Guinée', value: 'guinea' },
  { label: 'Guinée-Bissau', value: 'guinea_bissau' },
  { label: 'Guinée équatoriale', value: 'equatorial_guinea' },
  { label: 'Kenya', value: 'kenya' },
  { label: 'Lesotho', value: 'lesotho' },
  { label: 'Libéria', value: 'liberia' },
  { label: 'Libye', value: 'libya' },
  { label: 'Malawi', value: 'malawi' },
  { label: 'Mali', value: 'mali' },
  { label: 'Maroc', value: 'morocco' },
  { label: 'Mauritanie', value: 'mauritania' },
  { label: 'Mozambique', value: 'mozambique' },
  { label: 'Namibie', value: 'namibia' },
  { label: 'Niger', value: 'niger' },
  { label: 'Nigeria', value: 'nigeria' },
  { label: 'Ouganda', value: 'uganda' },
  { label: 'République centrafricaine', value: 'central_african_republic' },
  { label: 'République démocratique du Congo', value: 'democratic_republic_of_the_congo' },
  { label: 'Rwanda', value: 'rwanda' },
  { label: 'Sao Tomé-et-Principe', value: 'sao_tome_and_principe' },
  { label: 'Sénégal', value: 'senegal' },
  { label: 'Seychelles', value: 'seychelles' },
  { label: 'Sierra Leone', value: 'sierra_leone' },
  { label: 'Somalie', value: 'somalia' },
  { label: 'Soudan', value: 'sudan' },
  { label: 'Soudan du Sud', value: 'south_sudan' },
  { label: 'Swaziland', value: 'swaziland' },
  { label: 'Tanzanie', value: 'tanzania' },
  { label: 'Tchad', value: 'chad' },
  { label: 'Togo', value: 'togo' },
  { label: 'Tunisie', value: 'tunisia' },
  { label: 'Zambie', value: 'zambia' },
  { label: 'Zimbabwe', value: 'zimbabwe' },
];

// Helper function to get label from value
export const getCountryLabel = (value: string): string => {
  const country = ALL_COUNTRIES.find(c => c.value === value);
  return country?.label || value;
};

// Badge color for countries
export const COUNTRY_BADGE_COLOR = "bg-green-100 text-green-800";

// Optional: Create a type for the values
export type CountryValue = typeof ALL_COUNTRIES[number]['value'];
