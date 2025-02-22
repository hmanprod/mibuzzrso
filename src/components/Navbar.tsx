'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Bell, MessageSquare, Plus } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className }: NavbarProps) {
  return (
    <nav className={twMerge("h-[60px] bg-white border-b border-[#EAEAEA]", className)}>
      <div className="h-full mx-auto px-6 flex items-center justify-between">
        {/* Zone gauche : Logo et navigation principale */}
        <div className="flex items-center gap-8">
          <div className="text-[#2D2D2D] font-bold text-[20px]">BandLab</div>
          <div className="hidden md:flex items-center gap-8">
            <button className="text-[#2D2D2D] font-medium text-[14px] hover:text-[#000000] transition-colors rounded-[18px] px-4 py-2">
              Fil d&apos;actualité
            </button>
            <button className="text-[#666666] text-[14px] hover:text-[#2D2D2D] transition-colors rounded-[18px] px-4 py-2">
              Challenges
            </button>
            <button className="text-[#666666] text-[14px] hover:text-[#2D2D2D] transition-colors rounded-[18px] px-4 py-2">
              Bibliothèque
            </button>
          </div>
        </div>

        {/* Zone centrale : Recherche */}
        <div className="flex-1 max-w-[400px] mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4D4D] focus:ring-opacity-50"
            />
          </div>
        </div>

        {/* Zone droite : Actions et profil */}
        <div className="flex items-center gap-6">
          <button className="text-[#666666] hover:text-[#2D2D2D] transition-colors md:hidden">
            <Search className="w-5 h-5 text-gray-400" />
          </button>
          <button className="text-[#666666] hover:text-[#2D2D2D] transition-colors">
            <Bell className="w-6 h-6" />
          </button>
          <button className="text-[#666666] hover:text-[#2D2D2D] transition-colors">
            <MessageSquare className="w-6 h-6" />
          </button>
          <button className="hidden md:flex items-center gap-2 bg-[#FA4D4D] hover:bg-[#E63F3F] text-white px-4 py-1.5 rounded-[18px] text-[14px] font-semibold transition-colors">
            <Plus className="w-5 h-5" />
            <span>Créer</span>
          </button>
          <div className="flex items-center gap-2">
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop"
              alt="Profile"
              className="w-[32px] h-[32px] rounded-full object-cover"
            />
            <svg
              className="w-4 h-4 text-[#666666]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </nav>
  );
}
