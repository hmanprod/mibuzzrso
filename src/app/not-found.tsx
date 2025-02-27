'use client';

import { NotFound } from '@/components/ui/not-found';

export default function NotFoundPage() {
  return (
    <NotFound 
      title="Impossible de trouver un élément correspondant"
      message="Il a peut-être été supprimé"
      buttonText="Retour à l'accueil"
      iconType="alert"
      iconSize={48}
      iconColor="#6b7280"
    />
  );
}
