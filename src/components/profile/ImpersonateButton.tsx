'use client';

import { LogIn } from 'lucide-react';

interface ImpersonateButtonProps {
  stageName: string;
  userId: string;
  isAdmin: boolean;
  isCurrentUser: boolean;
}

export function ImpersonateButton({ stageName, userId, isAdmin, isCurrentUser }: ImpersonateButtonProps) {
  if (!isAdmin || isCurrentUser) {
    return null;
  }

  console.log(userId);

  return (
    <button 
      className="flex items-center gap-2 text-md font-medium rounded-full px-3 py-1 transition-colors border border-[#FA4D4D] text-[#FA4D4D] hover:bg-red-50"
    >
      <LogIn className="w-3 h-3" />
      <span>Se connecter en tant que {stageName}</span>
    </button>
  );
}
