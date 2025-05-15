import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import { Music2, Heart, Users, Lightbulb } from 'lucide-react';

export default function LibrarySidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 border-r border-gray-200 min-h-[calc(100vh-60px)]">
      <nav className="p-4 space-y-2">
        <Link
          href="/musics/my-musics"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
            pathname === '/musics/my-musics' && 'bg-gray-100'
          )}
        >
          <Music2 className="w-6 h-6" />
          <span className="font-medium">Ma bibliothèque</span>
        </Link>

        <Link
          href="/musics/likes"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
            pathname === '/musics/likes' && 'bg-gray-100'
          )}
        >
          <Heart className="w-6 h-6" />
          <span className="font-medium">Musiques aimées</span>
        </Link>

        <Link
          href="/musics/subscriptions"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
            pathname === '/musics/subscriptions' && 'bg-gray-100'
          )}
        >
          <Users className="w-6 h-6" />
          <span className="font-medium">Mes abonnements</span>
        </Link>

        <Link
          href="/feedbacks"
          className={twMerge(
            'flex items-center gap-3 px-4 py-4 text-gray-600 hover:bg-gray-100 transition-colors rounded-[12px]',
            pathname === '/feedback' && 'bg-gray-100'
          )}
        >
          <Lightbulb className="w-6 h-6" />
          <span className="font-medium">Feedback & Idées</span>
        </Link>
      </nav>
    </aside>
  );
}
