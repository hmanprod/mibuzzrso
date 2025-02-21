'use client';

import { Image as ImageIcon, Music, Video } from 'lucide-react';

interface CreatePostBlockProps {
  userImage: string;
  onOpen: () => void;
}

export default function CreatePostBlock({ userImage, onOpen }: CreatePostBlockProps) {
  return (
    <div className="bg-white rounded-[18px] shadow-sm p-4 space-y-4">
      {/* Zone de saisie */}
      <div className="flex items-center gap-3">
        <img
          src={userImage}
          alt="Your profile"
          className="w-10 h-10 rounded-full"
        />
        <button
          onClick={onOpen}
          className="flex-1 h-12 px-4 rounded-[18px] bg-gray-50 hover:bg-gray-100 text-left text-gray-500 transition-colors"
        >
          Quoi de neuf ?
        </button>
      </div>

      {/* Séparateur */}
      <div className="h-[1px] bg-gray-100" />

      {/* Options de publication */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpen}
          className="flex-1 h-10 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 rounded-[18px] transition-colors"
        >
          <Music size={20} />
          <span className="text-sm font-medium">Audio</span>
        </button>
        <button
          onClick={onOpen}
          className="flex-1 h-10 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 rounded-[18px] transition-colors"
        >
          <Video size={20} />
          <span className="text-sm font-medium">Vidéo</span>
        </button>
        <button
          onClick={onOpen}
          className="flex-1 h-10 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 rounded-[18px] transition-colors"
        >
          <ImageIcon size={20} />
          <span className="text-sm font-medium">Photo</span>
        </button>
      </div>
    </div>
  );
}
