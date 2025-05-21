'use client';

import { useState, useRef, useEffect } from 'react';
import PointsDialog from '@/components/points/PointsDialog';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, LogOut, Search, ShieldCheck, Trophy } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Avatar } from './ui/Avatar';
import Image from 'next/image';
import { useSession } from '@/components/providers/SessionProvider';
import SearchBar from '@/components/ui/SearchBar';
import RankBadge from './profile/RankBadge';
import PointsBadge from './ui/PointsBadge';

interface NavbarProps {
  onOpenCreatePost?: () => void;
  className?: string;
}

export default function Navbar({ className }: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useSession();

  const handleSignOut = async () => {
      router.push('/auth/logout');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // console.log("the profiles", profile?.points);
  

  return (
    <nav className={twMerge("h-[60px] bg-white border-b border-[#EAEAEA]", className)}>
      <div className="h-full max-w-[1300px] mx-auto px-6 flex items-center justify-between">
        {/* Zone gauche : Logo et navigation principale */}
        <div className="flex items-center gap-8">
          <Link href="/">
            <Image
              src="/images/logo_black.svg"
              alt="MIBUZZ Logo"
              width={130}
              height={45}
              className="object-cover"
            />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/feed"
              className={twMerge(
                "text-[#2D2D2D] font-medium text-[14px] hover:text-[#000000] transition-colors rounded-[18px] px-4 py-2",
                pathname === '/feed' && 'bg-gray-100'
              )}
            >
              Fil d&apos;actualité
            </Link>
            <Link 
              href="/musics/all"
              className={twMerge(
                "text-[#2D2D2D] font-medium text-[14px] hover:text-[#000000] transition-colors rounded-[18px] px-4 py-2",
                pathname === '/musics' && 'bg-gray-100'
              )}
            >
              Bibliothèque
            </Link>
          </div>
        </div>

        {/* Zone centrale : Recherche */}
        <div className="flex-1 max-w-[400px] mx-8 hidden md:block">
          <SearchBar />
        </div>

        {/* Zone droite : Actions et profil */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/feed/search')}
            className="text-[#666666] hover:text-[#2D2D2D] transition-colors md:hidden"
          >
            <Search className="w-5 h-5 text-gray-400" />
          </button>
          {/* <button className="text-[#666666] hover:text-[#2D2D2D] transition-colors">
            <Bell className="w-6 h-6" />
          </button> */}
          {/* <button className="text-[#666666] hover:text-[#2D2D2D] transition-colors">
            <MessageSquare className="w-6 h-6" />
          </button> */}
          {/* <button className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-[18px] text-[14px] font-semibold transition-colors">
            <Plus className="w-5 h-5" />
            <span>Créer</span>
          </button> */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center gap-2 bg-primary/20 rounded-full p-1">
                <div 
                  className="hidden md:flex items-end gap-0.5 bg-primary/80 rounded-full text-white p-1 pr-3 cursor-pointer hover:bg-primary transition-colors"
                  onClick={() => setShowPointsDialog(true)}
                >
                    <PointsBadge points={profile?.points || 0} />
                  {profile?.points !== undefined && profile.points >= 150 && (
                    <RankBadge points={profile.points} />
                  )}
                </div>

                {/* Points Dialog */}
                {profile?.points !== undefined && (
                  <PointsDialog 
                    open={showPointsDialog} 
                    onClose={() => setShowPointsDialog(false)} 
                    points={profile.points} 
                  />
                )}
                <button
                  onClick={toggleDropdown}
                  className="rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                >
                  <Avatar
                    src={profile?.avatar_url || null}
                    stageName={profile?.stage_name}
                    size={32}
                    className="object-cover"
                  />
                </button>
              </div>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push('/profile');
                    }}
                    className="flex items-center  text-[15px] gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left"
                  >
                    <User className="w-4 h-4" />
                    <span>Mon profil</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push('/account');
                    }}
                    className="flex items-center  text-[15px] gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Mon compte</span>
                  </button>

                  {profile?.points && profile.points >= 150 && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push('/rankings');
                      }}
                      className="flex items-center text-[15px] gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Classement</span>
                    </button>
                  )}

                  <div className="h-[1px] bg-gray-100 my-1" />

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-[15px] text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
