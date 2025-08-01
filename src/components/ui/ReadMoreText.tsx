'use client';

import { useState, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

interface ReadMoreTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export default function ReadMoreText({ text, maxLength = 150, className }: ReadMoreTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const canTruncate = text.length > maxLength;

  const displayText = useMemo(() => {
    if (!canTruncate || isExpanded) {
      return text;
    }
    return `${text.substring(0, maxLength)}...`;
  }, [canTruncate, isExpanded, text, maxLength]);

  return (
    <div className="text-sm text-gray-600">
      <p className={twMerge("break-words", className)}>{displayText}</p>
      {canTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm font-semibold text-primary hover:underline mt-1 focus:outline-none"
        >
          {isExpanded ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}
