'use client';

import Link from 'next/link';
import { twMerge } from 'tailwind-merge';
import { Flame, Heart, Users, Music, Disc, ListMusic, Video } from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  return (
    <aside className={twMerge("bg-transparent backdrop-blur-sm p-6", className)}>
      <nav className="space-y-2">
        <Link
          href="/"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
          )}
        >
          <Flame className="w-6 h-6" />
          <span className="font-medium">Challenges</span>
        </Link>

        <Link
          href="/"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
          )}
        >
          <Heart className="w-6 h-6" />
          <span className="font-medium">Publications aimées</span>
        </Link>

        <Link
          href="/"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
          )}
        >
          <Users className="w-6 h-6" />
          <span className="font-medium">Abonnements</span>
        </Link>

        <div className="h-[1px] bg-gray-100 my-4" />

        <Link
          href="/"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
          )}
        >
          <Music className="w-6 h-6" />
          <span className="font-medium">Musique</span>
        </Link>

        {/* <Link
          href="/"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
          )}
        >
          <Disc className="w-6 h-6" />
          <span className="font-medium">Albums aimés</span>
        </Link> */}

        {/* <Link
          href="/"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
          )}
        >
          <ListMusic className="w-6 h-6" />
          <span className="font-medium">Playlists aimées</span>
        </Link> */}

        <Link
          href="/"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
          )}
        >
          <Video className="w-6 h-6" />
          <span className="font-medium">Vidéos</span>
        </Link>
      </nav>
    </aside>
  );
}
