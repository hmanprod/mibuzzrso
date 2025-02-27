'use client';

import { useState } from 'react';
import { TimeAgo } from '@/components/ui/TimeAgo';

export default function TimeAgoExamplePage() {
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  
  // Sample dates
  const now = new Date();
  const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
  const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
  const daysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
  const weeksAgo = new Date(now.getTime() - 2 * 7 * 24 * 60 * 60 * 1000); // 2 weeks ago
  const monthsAgo = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000); // ~3 months ago
  const yearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000); // ~2 years ago
  
  // Future dates
  const minutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
  const hoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now
  const daysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">TimeAgo Examples</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Language Selection</h2>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded ${language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('fr')}
            className={`px-3 py-1 rounded ${language === 'fr' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Français
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Past Times</h2>
          <ul className="space-y-3">
            <li className="flex justify-between">
              <span>Just now:</span>
              <TimeAgo date={now} defaultLanguage={language} />
            </li>
            <li className="flex justify-between">
              <span>5 minutes ago:</span>
              <TimeAgo date={minutesAgo} defaultLanguage={language} />
            </li>
            <li className="flex justify-between">
              <span>3 hours ago:</span>
              <TimeAgo date={hoursAgo} defaultLanguage={language} />
            </li>
            <li className="flex justify-between">
              <span>2 days ago:</span>
              <TimeAgo date={daysAgo} defaultLanguage={language} />
            </li>
            <li className="flex justify-between">
              <span>2 weeks ago:</span>
              <TimeAgo date={weeksAgo} defaultLanguage={language} />
            </li>
            <li className="flex justify-between">
              <span>3 months ago:</span>
              <TimeAgo date={monthsAgo} defaultLanguage={language} />
            </li>
            <li className="flex justify-between">
              <span>2 years ago:</span>
              <TimeAgo date={yearsAgo} defaultLanguage={language} />
            </li>
          </ul>
        </div>
        
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Future Times</h2>
          <ul className="space-y-3">
            <li className="flex justify-between">
              <span>5 minutes from now:</span>
              <TimeAgo date={minutesFromNow} defaultLanguage={language} />
            </li>
            <li className="flex justify-between">
              <span>3 hours from now:</span>
              <TimeAgo date={hoursFromNow} defaultLanguage={language} />
            </li>
            <li className="flex justify-between">
              <span>2 days from now:</span>
              <TimeAgo date={daysFromNow} defaultLanguage={language} />
            </li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8 border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Individual Language Toggle</h2>
        <p className="mb-2">Each of these examples has its own language toggle button:</p>
        <ul className="space-y-3">
          <li className="flex justify-between">
            <span>Just now:</span>
            <TimeAgo date={now} showLanguageToggle={true} />
          </li>
          <li className="flex justify-between">
            <span>3 hours ago:</span>
            <TimeAgo date={hoursAgo} showLanguageToggle={true} />
          </li>
          <li className="flex justify-between">
            <span>2 days from now:</span>
            <TimeAgo date={daysFromNow} showLanguageToggle={true} />
          </li>
        </ul>
      </div>
    </div>
  );
}
