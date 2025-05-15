'use client';

import { Avatar } from '../ui/Avatar';
import { useSession } from '@/components/providers/SessionProvider';

interface CreatePostBlockProps {
  onClick: () => void;
}

export default function CreatePostBlock({ onClick }: CreatePostBlockProps) {
  const { profile } = useSession();

  return (
    <div className="bg-white rounded-[18px] p-4 space-y-4 mb-4">
      {/* Zone de saisie */}
      <div className="flex items-center gap-3">
        <Avatar
          src={profile?.avatar_url || null}
          stageName={profile?.stage_name}
          size={40}
          className="rounded-full"
        />
        
        <button
          onClick={onClick}
          className="flex-1 h-12 px-4 rounded-[18px] bg-gray-50 hover:bg-gray-100 text-left text-gray-500 transition-colors"
        >
          Quoi de neuf ?
        </button>
      </div>

      

      
    </div>
  );
}
