'use client';

import { useState, useRef, useEffect } from 'react';
import PointsDialog from '@/components/points/PointsDialog';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, LogOut, ShieldCheck, Menu, X } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useSession();

  const handleSignOut = async () => {
    router.push('/auth/logout');
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className={twMerge("h-[60px] bg-white border-b border-[#EAEAEA]", className)}>
      <div className="h-full max-w-[1300px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Left Zone: Logo & Main Navigation */}
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
                pathname.startsWith('/musics') && 'bg-gray-100'
              )}
            >
              Bibliothèque
            </Link>
          </div>
        </div>

        {/* Center Zone: Search Bar */}
        <div className="flex-1 max-w-[400px] mx-8 hidden md:block">
          <SearchBar />
        </div>

        {/* Right Zone: Actions & Profile */}
        <div className="flex items-center gap-2 md:gap-4">

          
          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              {/* Mobile: Just Avatar */}
              <div className="md:hidden">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center justify-center rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                  aria-label="Toggle profile menu"
                >
                  <Avatar
                    src={profile?.avatar_url || null}
                    stageName={profile?.stage_name}
                    size={32}
                    className="object-cover"
                  />
                  
                </button>
              </div>

              {/* Desktop: Points + Avatar */}
              <div className="hidden md:flex items-center gap-2 bg-primary/20 rounded-full p-1">
                <div 
                  className="flex items-center gap-0.5 bg-primary/80 rounded-full text-white p-1 pr-3 cursor-pointer hover:bg-primary transition-colors"
                  onClick={() => setShowPointsDialog(true)}
                >
                    <PointsBadge points={profile?.points || 0} />
                  {profile?.points !== undefined && profile.points >= 150 && (
                    <RankBadge points={profile.points} />
                  )}
                </div>
                <button
                  onClick={toggleDropdown}
                  className="flex justify-center items-center rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                  aria-label="Toggle profile menu"
                >
                  <Avatar
                    src={profile?.avatar_url || null}
                    stageName={profile?.stage_name}
                    size={32}
                    className="object-cover"
                  />
                  
                </button>
              </div>

              {/* Points Dialog - now a direct child of the relative container */}
              {profile?.points !== undefined && (
                <PointsDialog 
                  open={showPointsDialog} 
                  onClose={() => setShowPointsDialog(false)} 
                  points={profile.points} 
                />
              )}

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100 animate-in fade-in-0 zoom-in-95">
                  <button
                    onClick={() => { setIsDropdownOpen(false); router.push('/profile'); }}
                    className="flex items-center text-[15px] gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left"
                  >
                    <User className="w-4 h-4" />
                    <span>Mon profil</span>
                  </button>
                  <button
                    onClick={() => { setIsDropdownOpen(false); router.push('/account'); }}
                    className="flex items-center text-[15px] gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Mon compte</span>
                  </button>
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

          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-500 hover:text-gray-800 p-2 rounded-full transition-colors md:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden animate-in fade-in-0"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="absolute top-0 right-0 h-full w-4/5 max-w-sm bg-white z-50 p-6 shadow-xl animate-in slide-in-from-right-full duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
                <X className="w-6 h-6 text-gray-500 hover:text-gray-800" />
              </button>
            </div>

            <div 
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 mb-6 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                  setShowPointsDialog(true);
                  setIsMobileMenuOpen(false);
              }}
            >
              <span className="font-medium text-gray-700">Mes points</span>
              <div className="flex items-end gap-0.5 text-white bg-primary/80 rounded-full p-1 pr-3">
                  <PointsBadge points={profile?.points || 0} />
                  {profile?.points !== undefined && profile.points >= 150 && (
                      <RankBadge points={profile.points} />
                  )}
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              <div className="px-1 mb-4">
                <SearchBar />
              </div>
              <Link
                href="/feed"
                className={twMerge(
                  "text-gray-700 font-medium text-base hover:bg-gray-100 p-3 rounded-lg transition-colors",
                  pathname === '/feed' && 'bg-primary/10 text-primary'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Fil d&apos;actualité
              </Link>
              <Link
                href="/musics/all"
                className={twMerge(
                  "text-gray-700 font-medium text-base hover:bg-gray-100 p-3 rounded-lg transition-colors",
                  pathname.startsWith('/musics') && 'bg-primary/10 text-primary'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Bibliothèque
              </Link>
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
}
