"use client";

import { useState } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Profile } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect, type Option } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const MUSICAL_ACTIVITIES: Option[] = [
  { label: 'DJ', value: 'dj' },
  { label: 'Producteur', value: 'producer' },
  { label: 'Beatmaker', value: 'beatmaker' },
  { label: 'Chanteur', value: 'singer' },
  { label: 'Rappeur', value: 'rapper' },
  { label: 'Musicien', value: 'musician' },
  { label: 'Groupe', value: 'bands' },
  { label: 'Ingénieur Son', value: 'sound_engineer' },
  { label: 'Programmateur musical', value: 'curator' },
  { label: 'Manageur', value: 'manager' },
];

const GENRES: Option[] = [
  { label: 'Afro', value: 'afro' },
  { label: 'Hip-Hop', value: 'hip_hop' },
  { label: 'R&B', value: 'r_and_b' },
  { label: 'Pop', value: 'pop' },
  { label: 'Rock', value: 'rock' },
  { label: 'Électronique', value: 'electronic' },
  { label: 'Jazz', value: 'jazz' },
  { label: 'Classique', value: 'classical' },
];

// Pays de l'océan Indien en premier
const INDIAN_OCEAN_COUNTRIES: Option[] = [
  { label: 'Madagascar', value: 'madagascar' },
  { label: 'Comores', value: 'comoros' },
  { label: 'La Réunion', value: 'reunion' },
  { label: 'Maurice', value: 'mauritius' },
  { label: 'Mayotte', value: 'mayotte' },
];

// Liste complète des pays
const ALL_COUNTRIES: Option[] = [
  ...INDIAN_OCEAN_COUNTRIES,
  { label: 'Afrique du Sud', value: 'south_africa' },
  { label: 'Algérie', value: 'algeria' },
  { label: 'Angola', value: 'angola' },
  { label: 'Bénin', value: 'benin' },
  { label: 'Botswana', value: 'botswana' },
  { label: 'Burkina Faso', value: 'burkina_faso' },
  { label: 'Burundi', value: 'burundi' },
  { label: 'Cameroun', value: 'cameroon' },
  { label: 'Cap-Vert', value: 'cape_verde' },
  { label: 'Congo', value: 'congo' },
  { label: 'Côte d\'Ivoire', value: 'ivory_coast' },
  { label: 'Djibouti', value: 'djibouti' },
  { label: 'Égypte', value: 'egypt' },
  { label: 'Érythrée', value: 'eritrea' },
  { label: 'Éthiopie', value: 'ethiopia' },
  { label: 'Gabon', value: 'gabon' },
  { label: 'Gambie', value: 'gambia' },
  { label: 'Ghana', value: 'ghana' },
  { label: 'Guinée', value: 'guinea' },
  { label: 'Guinée-Bissau', value: 'guinea_bissau' },
  { label: 'Guinée équatoriale', value: 'equatorial_guinea' },
  { label: 'Kenya', value: 'kenya' },
  { label: 'Lesotho', value: 'lesotho' },
  { label: 'Libéria', value: 'liberia' },
  { label: 'Libye', value: 'libya' },
  { label: 'Malawi', value: 'malawi' },
  { label: 'Mali', value: 'mali' },
  { label: 'Maroc', value: 'morocco' },
  { label: 'Mauritanie', value: 'mauritania' },
  { label: 'Mozambique', value: 'mozambique' },
  { label: 'Namibie', value: 'namibia' },
  { label: 'Niger', value: 'niger' },
  { label: 'Nigeria', value: 'nigeria' },
  { label: 'Ouganda', value: 'uganda' },
  { label: 'République centrafricaine', value: 'central_african_republic' },
  { label: 'République démocratique du Congo', value: 'democratic_republic_of_the_congo' },
  { label: 'Rwanda', value: 'rwanda' },
  { label: 'Sao Tomé-et-Principe', value: 'sao_tome_and_principe' },
  { label: 'Sénégal', value: 'senegal' },
  { label: 'Seychelles', value: 'seychelles' },
  { label: 'Sierra Leone', value: 'sierra_leone' },
  { label: 'Somalie', value: 'somalia' },
  { label: 'Soudan', value: 'sudan' },
  { label: 'Soudan du Sud', value: 'south_sudan' },
  { label: 'Swaziland', value: 'swaziland' },
  { label: 'Tanzanie', value: 'tanzania' },
  { label: 'Tchad', value: 'chad' },
  { label: 'Togo', value: 'togo' },
  { label: 'Tunisie', value: 'tunisia' },
  { label: 'Zambie', value: 'zambia' },
  { label: 'Zimbabwe', value: 'zimbabwe' },
];

export function OnboardingModal() {
  const { updateProfile } = useOnboarding();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({
    stage_name: '',
    musical_interests: [],
    talents: [],
    country: '',
    label: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await updateProfile(formData);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent
        className="sm:max-w-[425px]"
        showClose={false}
        closeOnOverlayClick={false}
      >
        <DialogHeader>
          <DialogTitle>Compléter votre profil</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="stageName" className="text-sm font-medium">
              Nom d&apos;artiste
            </label>
            <Input
              id="stageName"
              value={formData.stage_name || ''}
              onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
              placeholder="Nom d'artiste"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="label" className="text-sm font-medium flex items-center gap-2">
              Label <span className="text-xs text-muted-foreground">(optionnel)</span>
            </label>
            <Input
              id="label"
              value={formData.label || ''}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Nom de votre label"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="activities" className="text-sm font-medium">
              Vous êtes
            </label>
            <MultiSelect
              options={MUSICAL_ACTIVITIES}
              selected={formData.talents || []}
              onChange={(values) => setFormData({ ...formData, talents: values })}
              placeholder="Choisir une ou plusieurs activités"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="genres" className="text-sm font-medium">
              Vos genres musicaux
            </label>
            <MultiSelect
              options={GENRES}
              selected={formData.musical_interests || []}
              onChange={(values) => setFormData({ ...formData, musical_interests: values })}
              placeholder="Choisir un ou plusieurs genres"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="country" className="text-sm font-medium">
              Pays
            </label>
            <Select
              value={formData.country || ''}
              onValueChange={(value) => setFormData({ ...formData, country: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir votre pays" />
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

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                'Compléter votre profil'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
