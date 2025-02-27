'use client';

import { useState } from 'react';
import { formatTimeago } from '@/lib/timeago';

interface TimeAgoProps {
  date: Date | string | number;
  defaultLanguage?: 'en' | 'fr';
  showLanguageToggle?: boolean;
}

/**
 * A component that displays a time in a human-readable format using timeago.js
 * with support for English and French languages
 */
export function TimeAgo({ 
  date, 
  defaultLanguage = 'en',
  showLanguageToggle = false 
}: TimeAgoProps) {
  const [language, setLanguage] = useState<'en' | 'fr'>(defaultLanguage);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'fr' : 'en');
  };

  return (
    <span className="inline-flex items-center gap-2">
      <span>{formatTimeago(date, language)}</span>
      {showLanguageToggle && (
        <button 
          onClick={toggleLanguage}
          className="text-xs px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          {language === 'en' ? 'FR' : 'EN'}
        </button>
      )}
    </span>
  );
}
