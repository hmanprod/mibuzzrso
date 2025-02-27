'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, FileX, UserX } from 'lucide-react';

interface NotFoundProps {
  title?: string;
  message?: string;
  buttonText?: string;
  iconType?: 'user' | 'file' | 'alert';
  iconSize?: number;
  iconColor?: string;
  onButtonClick?: () => void;
}

export function NotFound({
  title = "Contenu introuvable",
  message = "Nous n'avons pas pu trouver ce que vous recherchez. Il a peut-être été supprimé ou n'existe pas.",
  iconType = 'alert',
  iconSize = 48,
  iconColor = '#6b7280', // text-gray-500
}: NotFoundProps) {
  const router = useRouter();

  const handleBackClick = () => {
    router.back();
  };

  let IconComponent;
  switch (iconType) {
    case 'user':
      IconComponent = UserX;
      break;
    case 'file':
      IconComponent = FileX;
      break;
    case 'alert':
    default:
      IconComponent = AlertTriangle;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Back button */}
      <button 
        onClick={handleBackClick}
        className="mb-8 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="mr-2" size={20} />
        <span>Retour</span>
      </button>

      {/* Icon container with light gray background */}
      <div className="mb-8 p-10 bg-gray-100 rounded-full">
        <IconComponent size={iconSize} color={iconColor} strokeWidth={2} />
      </div>

      {/* Text content */}
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">{title}</h2>
        <p className="text-gray-600 mb-8">{message}</p>
        
      </div>
    </div>
  );
}
