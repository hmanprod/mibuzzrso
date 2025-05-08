'use client';

import Link from 'next/link';
import { twMerge } from 'tailwind-merge';
import { Flame, Heart, Users, Lightbulb } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={twMerge("flex flex-col justify-between bg-transparent p-6", className)}>
      <nav className="space-y-2 text-sm">
        <Link
          href="/feed/challenges"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
            pathname === '/challenges' && 'bg-gray-100'
          )}
        >
          <Flame className="w-6 h-6" />
          <span className="font-medium">Challenges</span>
        </Link>

        <Link
          href="/feed/likes"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
            pathname === '/feed/likes' && 'bg-gray-100'
          )}
        >
          <Heart className="w-6 h-6" />
          <span className="font-medium">Publications aimées</span>
        </Link>

        <Link
          href="/profile/followed"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
            pathname === '/profile/followed' && 'bg-gray-100'
          )}
        >
          <Users className="w-6 h-6" />
          <span className="font-medium">Abonnements</span>
        </Link>
      </nav>

      <nav className="text-sm">
        <Link
          href="/feedbacks"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
            pathname === '/feedbacks' && 'bg-gray-100'
          )}
        >
          <Lightbulb className="w-6 h-6" />
          <span className="font-medium">Feedback & Idees</span>
        </Link>
      </nav>
    </aside>
  );
}
