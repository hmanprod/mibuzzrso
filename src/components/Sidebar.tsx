'use client';

import { Flame, Users, Music, Video, Heart, Disc, ListMusic } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  return (
    <aside className={twMerge("bg-transparent backdrop-blur-sm p-6", className)}>
      <nav className="space-y-2">
        <button className="flex items-center gap-3 w-full p-3 text-[#2D2D2D] font-medium rounded hover:bg-[#F2F2F2] transition-colors">
          <Flame className="h-5 w-5" />
          <span className="text-base">Tendances</span>
        </button>
        <button className="flex items-center gap-3 w-full p-3 text-[#666666] rounded hover:bg-[#F2F2F2] transition-colors">
          <Users className="h-5 w-5" />
          <span className="text-base">Abonnements</span>
        </button>
        <button className="flex items-center gap-3 w-full p-3 text-[#666666] rounded hover:bg-[#F2F2F2] transition-colors">
          <Music className="h-5 w-5" />
          <span className="text-base">Musique</span>
        </button>
        <button className="flex items-center gap-3 w-full p-3 text-[#666666] rounded hover:bg-[#F2F2F2] transition-colors">
          <Video className="h-5 w-5" />
          <span className="text-base">Vidéos</span>
        </button>
        <button className="flex items-center gap-3 w-full p-3 text-[#666666] rounded hover:bg-[#F2F2F2] transition-colors">
          <Heart className="h-5 w-5" />
          <span className="text-base">Publications aimées</span>
        </button>
        <button className="flex items-center gap-3 w-full p-3 text-[#666666] rounded hover:bg-[#F2F2F2] transition-colors">
          <Disc className="h-5 w-5" />
          <span className="text-base">Albums aimés</span>
        </button>
        <button className="flex items-center gap-3 w-full p-3 text-[#666666] rounded hover:bg-[#F2F2F2] transition-colors">
          <ListMusic className="h-5 w-5" />
          <span className="text-base">Playlists aimées</span>
        </button>
      </nav>
    </aside>
  );
}
