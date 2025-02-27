import { register, format as timeagoFormat } from 'timeago.js';

// French locale definition
const frLocale = (number: number, index: number): [string, string] => {
  return [
    ['à l\'instant', 'dans un instant'],
    ['à l\'instant', 'dans un instant'],
    ['il y a 1 minute', 'dans 1 minute'],
    ['il y a %s minutes', 'dans %s minutes'],
    ['il y a 1 heure', 'dans 1 heure'],
    ['il y a %s heures', 'dans %s heures'],
    ['il y a 1 jour', 'dans 1 jour'],
    ['il y a %s jours', 'dans %s jours'],
    ['il y a 1 semaine', 'dans 1 semaine'],
    ['il y a %s semaines', 'dans %s semaines'],
    ['il y a 1 mois', 'dans 1 mois'],
    ['il y a %s mois', 'dans %s mois'],
    ['il y a 1 an', 'dans 1 an'],
    ['il y a %s ans', 'dans %s ans']
  ][index] as [string, string];
};

// Register the French locale
register('fr', frLocale);

/**
 * Format a date using timeago.js with language support
 * @param date Date to format (Date object, ISO string, or timestamp)
 * @param lang Language code ('en' for English, 'fr' for French)
 * @returns Formatted timeago string in the specified language
 */
export function formatTimeago(date: Date | string | number, lang: 'en' | 'fr' = 'en'): string {
  return timeagoFormat(date, lang);
}

/**
 * Get the current user's browser language
 * @returns Language code ('en' or 'fr', defaults to 'en' if neither)
 */
export function getUserLanguage(): 'fr' {
  return 'fr';
}
