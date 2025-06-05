'use client';

import { useState } from 'react';
import { searchUsers } from '@/actions/users/users';
import { Search, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface User {
  id: string;
  stage_name?: string;
  avatar_url?: string;
  email?: string;
  pseudo_url?: string;
  first_name?: string;
  last_name?: string;
}

interface JurySelectorProps {
  selectedJury: User[];
  onJuryChange: (jury: User[]) => void;
}

export default function JurySelector({ selectedJury, onJuryChange }: JurySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // TODO: Implémenter la recherche d'utilisateurs via Supabase
      const results = await searchUsers(query);
      setSearchResults(results.filter(user => 
        !selectedJury.some(selected => selected.id === user.id)
      ));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addJury = (user: User) => {
    if (selectedJury.length >= 4) {
      return; // Maximum 4 jurys
    }
    onJuryChange([...selectedJury, user]);
    setSearchResults(searchResults.filter(u => u.id !== user.id));
  };

  const removeJury = (userId: string) => {
    onJuryChange(selectedJury.filter(user => user.id !== userId));
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher un jury..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Liste des jurys sélectionnés */}
      <div className="space-y-2">
        <p className="text-sm text-gray-500">Jurys sélectionnés ({selectedJury.length}/4)</p>
        <div className="flex flex-wrap gap-2">
          {selectedJury.map(user => (
            <div
              key={user.id}
              className="flex items-center gap-2 bg-gray-100 rounded-full pl-2 pr-3 py-1"
            >
              <Avatar
                src={user.avatar_url || null}
                stageName={user.stage_name || user.email?.[0]}
                size={24}
                className="rounded-full"
              />
              <span className="text-sm">{user.stage_name || user.email}</span>
              <button
                onClick={() => removeJury(user.id)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Résultats de recherche */}
      {searchQuery.length >= 2 && (
        <div className="border rounded-lg divide-y">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              Recherche en cours...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map(user => (
              <button
                key={user.id}
                onClick={() => addJury(user)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
              >
                <Avatar
                  src={user.avatar_url || null}
                  stageName={user.stage_name || user.email?.[0]}
                  size={32}
                  className="rounded-full"
                />
                <div className="flex-1 text-left">
                  <p className="font-medium">{user.stage_name || `${user.first_name} ${user.last_name}`}</p>
                  <p className="text-sm text-gray-500">{user.pseudo_url || user.email}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              Aucun utilisateur trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}


