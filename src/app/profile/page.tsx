'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Music, Video, UsersRound, Plus, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import CreatePostBlock from '@/components/feed/CreatePostBlock';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'activity', label: 'Activité' },
  { id: 'music', label: 'Musique', icon: <Music className="w-4 h-4" /> },
  { id: 'videos', label: 'Vidéos', icon: <Video className="w-4 h-4" /> },
  { id: 'groups', label: 'Groupes', icon: <UsersRound className="w-4 h-4" /> },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('activity');
  const { user, profile } = useAuth();
  const router = useRouter();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 bg-gray-200">
          <button className="absolute right-4 bottom-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
            <Camera className="w-5 h-5" />
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {/* Colonne de gauche */}
            <div className="w-64 relative -mt-20">
              {/* Photo de profil */}
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white">
                  <Image
                    src="/images/placeholder-user.jpg"
                    alt="Profile"
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                </div>
                <button className="absolute right-0 bottom-0 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Informations utilisateur */}
              <div className="mt-4">
                <h1 className="text-2xl font-bold text-gray-900">{profile?.stage_name || 'Utilisateur'}</h1>
                <p className="text-gray-600">@{profile?.first_name || user?.email?.split('@')[0]}</p>
              </div>

              {/* Bouton Modifier le profil */}
              <div className="mt-6">
                <button 
                  onClick={() => router.push('/profile/edit')}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Modifier le profil</span>
                </button>
              </div>

              {/* Statistiques */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <div className="text-xl font-bold">0</div>
                  <div className="text-sm text-gray-600">Abonné</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">0</div>
                  <div className="text-sm text-gray-600">Suivi</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">0</div>
                  <div className="text-sm text-gray-600">Lecture</div>
                </div>
              </div>

              {/* Talents */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Talents</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">DJ/Beatmaker</span>
                </div>
              </div>

              {/* Genres préférés */}
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Genres préférés</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Hip-Hop</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">R&B et Soul</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Jazz</span>
                </div>
              </div>
            </div>

            {/* Colonne centrale */}
            <div className="flex-1">
              

              {/* Onglets */}
              <div className="mt-20 border-b border-gray-200">
                <div className="flex gap-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenu */}
              <div className="mt-6">
                {activeTab === 'activity' && (
                  <div>
                    <CreatePostBlock onOpen={() => {}} />
                    <div className="mt-8 text-center text-gray-600">
                      <Music className="w-12 h-12 mx-auto text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium">Il est temps de faire de la musique</h3>
                      <p className="mt-1">
                        Vous verrez votre fil d&apos;activités se remplir dès que vous commencerez à publier des
                        révisions ou des publications.
                      </p>
                      <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90">
                        Commencer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Colonne de droite - Suggestions */}
            <div className="w-64">
              <div className="bg-white mt-20 p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Suggestions</h2>
                  <button className="text-sm text-primary">Actualiser</button>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'HighUnicorn', followers: '4.2k abonnés' },
                    { name: 'Mari H &MH', followers: '2.3k abonnés' },
                    { name: 'rjaaaaye', followers: '43 abonnés' },
                  ].map((user, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.followers}</div>
                        </div>
                      </div>
                      <button className="text-primary">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
