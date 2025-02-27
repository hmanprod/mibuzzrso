'use client';

import { twMerge } from 'tailwind-merge';
import SuggestedUsers from './SuggestedUsers';

interface User {
  user_id: string;
  avatar_url?: string | null;
  stage_name?: string;
  full_name?: string;
  interaction_score?: number;
}

interface RightSidebarProps {
  className?: string;
  suggestedUsers?: User[];
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
