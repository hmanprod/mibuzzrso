'use client';

import { twMerge } from 'tailwind-merge';
import SuggestedUsers from './SuggestedUsers';

interface RightSidebarProps {
  className?: string;
  suggestedUsers?: any[];
}

export default function RightSidebar({ className, suggestedUsers = [] }: RightSidebarProps) {
  return (
    <aside className={twMerge("bg-[#F9F9F9] p-3", className)}>
      <div className="space-y-3">
        <SuggestedUsers users={suggestedUsers} />
      </div>
    </aside>
  );
}
