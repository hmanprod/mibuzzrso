'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from './button';
import { useRouter } from 'next/navigation';

interface MaintenanceProps {
  title?: string;
  message?: string;
  buttonText?: string;
  iconSize?: number;
  iconColor?: string;
}

export function Maintenance({
  title = 'Page en maintenance',
  message = 'Cette page est temporairement indisponible pour maintenance',
  buttonText = 'Retour à l\'accueil',
  iconSize = 48,
  iconColor = '#E94135'
}: MaintenanceProps) {
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <AlertTriangle size={iconSize} className="mx-auto" style={{ color: iconColor }} />
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600">{message}</p>
        <Button onClick={() => router.push('/')}>{buttonText}</Button>
      </div>
    </div>
  );
}
