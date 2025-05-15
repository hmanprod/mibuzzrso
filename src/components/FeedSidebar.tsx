import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import { Trophy, Heart, Users } from 'lucide-react';

export default function FeedSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 border-r border-gray-200 min-h-[calc(100vh-60px)]">
      <nav className="p-4 space-y-2">
        <Link
          href="/feed/challenges"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
            pathname === '/feed/challenges' && 'bg-gray-100'
          )}
        >
          <Trophy className="w-6 h-6" />
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
          href="/feed/subscriptions"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
            pathname === '/feed/subscriptions' && 'bg-gray-100'
          )}
        >
          <Users className="w-6 h-6" />
          <span className="font-medium">Abonnements</span>
        </Link>
      </nav>
    </aside>
  );
}
