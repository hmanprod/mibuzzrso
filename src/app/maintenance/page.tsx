'use client';

import { Maintenance } from '@/components/ui/maintenance';

export default function MaintenancePage() {
  return (
    <Maintenance 
      title="Page en maintenance"
      message="Cette section est temporairement indisponible pour maintenance"
      buttonText="Retour à l'accueil"
      iconSize={48}
      iconColor="#E94135"
    />
  );
}
