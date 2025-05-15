'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SearchAndFilters() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Rechercher..."
          className="pl-10 w-64"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="default">Tous</Button>
        <Button variant="outline">Audio</Button>
        <Button variant="outline">Vidéo</Button>
      </div>
    </div>
  );
}
