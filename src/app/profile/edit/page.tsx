'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { Plus } from 'lucide-react';
import { BsYoutube, BsInstagram, BsSpotify, BsGlobe2 } from "react-icons/bs";
import Navbar from '@/components/Navbar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AddItemModal } from '@/components/profile/AddItemModal';
import { TALENTS, MUSICAL_INTERESTS, ALL_COUNTRIES, INDIAN_OCEAN_COUNTRIES } from '@/constants/options';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProfileEditSkeleton from '@/components/profile/ProfileEditSkeleton';

interface SocialLink {
  platform: string;
  url: string;
  icon: React.ReactNode;
  label: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { profile, updateProfile } = useSession();
  const [loading, setLoading] = useState(false);
  


  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    stage_name: '',
    country: '',
    bio: '',
    social_links: {
      instagram: '',
      facebook: '',
      tiktok: '',
      spotify: '',
      moozik: '',
      youtube: '',
      website: ''
    },
    musical_interests: [] as string[],
    talents: [] as string[]
  });

  const [isTalentModalOpen, setIsTalentModalOpen] = useState(false);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);

  useEffect(() => {
    // Only update form data if profile exists and form is empty (initial load)
    if (profile && 
        (!formData.first_name && !formData.last_name && !formData.stage_name)) {
      // console.log('Loading initial profile data');
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        stage_name: profile.stage_name || '',
        country: profile.country || '',
        bio: profile.bio || '',
        social_links: {
          instagram: profile.social_links?.instagram || '',
          facebook: profile.social_links?.facebook || '',
          tiktok: profile.social_links?.tiktok || '',
          spotify: profile.social_links?.spotify || '',
          moozik: profile.social_links?.moozik || '',
          youtube: profile.social_links?.youtube || '',
          website: profile.social_links?.website || ''
        },
        musical_interests: profile.musical_interests || [],
        talents: profile.talents || []
      });
    }
  }, [profile, formData.first_name, formData.last_name, formData.stage_name]); // Added missing dependencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      // setLoading(false);
      router.push('/profile');
    } catch (error) {
      setLoading(false);
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  };    

  const socialLinks: SocialLink[] = [
    { platform: 'instagram', url: formData.social_links.instagram, icon: <BsInstagram className="w-5 h-5" />, label: 'Instagram' },
    { platform: 'spotify', url: formData.social_links.spotify, icon: <BsSpotify className="w-5 h-5" />, label: 'Spotify' },
    { platform: 'youtube', url: formData.social_links.youtube, icon: <BsYoutube className="w-5 h-5" />, label: 'YouTube' },
    { platform: 'website', url: formData.social_links.website, icon: <BsGlobe2 className="w-5 h-5" />, label: 'Site web' },
  ];

  return (
    <AuthGuard>
      <Navbar />
      <div className="max-w-[1300px] mx-auto">
        <div className="min-h-screen bg-white py-8">
          <div className="max-w-2xl mx-auto px-4">
            <h1 className="text-2xl font-bold mb-8">Éditer le profil</h1>

            {loading ? (
              <ProfileEditSkeleton />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations de base */}
                <div className="space-y-4">

                  <div>
                    <label htmlFor="stage_name" className="block text-sm font-medium text-gray-700">
                      Nom de scene
                    </label>
                    <input
                      type="text"
                      id="stage_name"
                      value={formData.stage_name}
                      onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex space-x-4">

                  <div className="w-1/2">
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                        Nom
                      </label>
                      <input
                        type="text"
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="w-1/2">
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                        Prénom
                      </label>
                      <input
                        type="text"
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Pays
                    </label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => setFormData({ ...formData, country: value })}
                    >
                      <SelectTrigger className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                        <SelectValue placeholder="Sélectionner un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Océan Indien</SelectLabel>
                          {INDIAN_OCEAN_COUNTRIES.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>Autres pays</SelectLabel>
                          {ALL_COUNTRIES.slice(INDIAN_OCEAN_COUNTRIES.length).map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
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
                              [link.platform]: e.target.value
                            }
                          })}
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder={`Ajouter un lien ${link.label}`}
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
                          onClick={() => setIsTalentModalOpen(true)}
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
                          onClick={() => setIsGenreModalOpen(true)}
                        >
                          <Plus className="w-4 h-4" />
                          Ajouter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal components */}
                <AddItemModal
                  title="Ajouter des talents"
                  options={TALENTS}
                  selectedItems={formData.talents}
                  onItemsChange={(items) => setFormData({ ...formData, talents: items })}
                  isOpen={isTalentModalOpen}
                  onClose={() => setIsTalentModalOpen(false)}
                  placeholder="Choisir un ou plusieurs talents"
                />

                <AddItemModal
                  title="Ajouter des genres musicaux"
                  options={MUSICAL_INTERESTS}
                  selectedItems={formData.musical_interests}
                  onItemsChange={(items) => setFormData({ ...formData, musical_interests: items })}
                  isOpen={isGenreModalOpen}
                  onClose={() => setIsGenreModalOpen(false)}
                  placeholder="Choisir un ou plusieurs genres"
                />

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
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
