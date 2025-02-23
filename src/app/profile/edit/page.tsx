'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Instagram, Music2, Video, Globe2, Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface SocialLink {
  platform: string;
  url: string;
  icon: React.ReactNode;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    location: '',
    bio: '',
    social_links: {
      instagram: '',
      spotify: '',
      youtube: '',
      website: ''
    },
    musical_interests: [] as string[],
    talents: [] as string[]
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        location: profile.location || '',
        bio: profile.bio || '',
        social_links: profile.social_links || {
          instagram: '',
          spotify: '',
          youtube: '',
          website: ''
        },
        musical_interests: profile.musical_interests || [],
        talents: profile.talents || []
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      router.push('/profile');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  };

  const socialLinks: SocialLink[] = [
    { platform: 'Instagram', url: formData.social_links.instagram, icon: <Instagram className="w-5 h-5" /> },
    { platform: 'Spotify', url: formData.social_links.spotify, icon: <Music2 className="w-5 h-5" /> },
    { platform: 'YouTube', url: formData.social_links.youtube, icon: <Video className="w-5 h-5" /> },
    { platform: 'Site web', url: formData.social_links.website, icon: <Globe2 className="w-5 h-5" /> },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-8">Éditer le profil</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Nom d'utilisateur
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500">
                    @
                  </span>
                  <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="block w-full rounded-r-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Localisation
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Rechercher une ville"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  À propos
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Décrivez-vous en quelques mots..."
                />
              </div>
            </div>

            {/* Liens sociaux */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Liens</h2>
              <div className="space-y-4">
                {socialLinks.map((link) => (
                  <div key={link.platform} className="flex items-center gap-2">
                    {link.icon}
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          [link.platform.toLowerCase()]: e.target.value
                        }
                      })}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder={`Ajouter un lien ${link.platform}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Intérêts musicaux */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Intérêts musicaux</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Talents
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.talents.map((talent, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1"
                      >
                        {talent}
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            talents: formData.talents.filter((_, i) => i !== index)
                          })}
                          className="text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      className="px-3 py-1 border border-gray-300 rounded-full text-sm flex items-center gap-1 hover:bg-gray-50"
                      onClick={() => {
                        const talent = prompt('Ajouter un talent');
                        if (talent) {
                          setFormData({
                            ...formData,
                            talents: [...formData.talents, talent]
                          });
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genres préférés
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.musical_interests.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1"
                      >
                        {genre}
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            musical_interests: formData.musical_interests.filter((_, i) => i !== index)
                          })}
                          className="text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      className="px-3 py-1 border border-gray-300 rounded-full text-sm flex items-center gap-1 hover:bg-gray-50"
                      onClick={() => {
                        const genre = prompt('Ajouter un genre');
                        if (genre) {
                          setFormData({
                            ...formData,
                            musical_interests: [...formData.musical_interests, genre]
                          });
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
              >
                Mettre à jour
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
