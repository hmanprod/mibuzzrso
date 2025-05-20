'use client';

// import Link from 'next/link';
// import { twMerge } from 'tailwind-merge';
// import { Music, Heart, Users, Lightbulb } from 'lucide-react';
import { usePathname } from 'next/navigation';
import FeedSidebar from './FeedSidebar';
import LibrarySidebar from './LibrarySidebar';

export default function Sidebar() {
  const pathname = usePathname();
  
  // Use FeedSidebar for /feed routes, LibrarySidebar for /musics routes
  if (pathname?.startsWith('/musics')) {
    return <LibrarySidebar />;
  }
  
  return <FeedSidebar />;
}
