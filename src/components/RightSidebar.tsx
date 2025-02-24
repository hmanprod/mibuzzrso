'use client';

import { Plus } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Image from 'next/image';

interface RightSidebarProps {
  className?: string;
}

export default function RightSidebar({ className }: RightSidebarProps) {
  const suggestions = [
    { id: 1, name: 'Jordan Adeli', followers: '14.2K', image: 'https://images.unsplash.com/photo-1520785643438-5bf77931f493?w=100&h=100&fit=crop' },
    { id: 2, name: 'GENMARIE', followers: '26.5K', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
    { id: 3, name: 'Onigumi84', followers: '9K', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' }
  ];

  return (
    <aside className={twMerge("bg-[#F9F9F9] p-6", className)}>
      <div className="space-y-6">
        <div className="bg-white rounded-[18px] p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-lg text-[#2D2D2D]">Suggestions à suivre</h3>
            <button className="text-sm text-[#666666] hover:text-[#2D2D2D]">Actualiser</button>
          </div>
          <div className="space-y-4">
            {suggestions.map(user => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src={user.image} alt={user.name} className="w-[30px] h-[30px] rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-base text-[#2D2D2D]">{user.name}</p>
                    <p className="text-sm text-[#666666]">{user.followers} Abonnés</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-[#FA4D4D] hover:text-[#E63F3F] transition-colors">
                  <Plus className="w-5 h-5" />
                  <span>Suivre</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
