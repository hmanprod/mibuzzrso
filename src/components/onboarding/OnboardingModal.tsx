"use client";

import { useState, useEffect } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { Profile } from '@/types/database';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { 
  TALENTS, 
  MUSICAL_INTERESTS, 
  INDIAN_OCEAN_COUNTRIES, 
  ALL_COUNTRIES 
} from '@/constants/options';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function OnboardingModal() {
  const { profile, updateProfile, isLoading: sessionLoading } = useSession();
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({
    stage_name: profile?.stage_name ?? '',
    musical_interests: Array.isArray(profile?.musical_interests) ? profile.musical_interests : [],
    talents: Array.isArray(profile?.talents) ? profile.talents : [],
    country: profile?.country ?? '',
    label: profile?.label ?? '',
    points: profile?.points ?? 5,
    
  });

  useEffect(() => {
    
    
    if (profile) {
      setFormData({
        stage_name: profile.stage_name ?? '',
        musical_interests: Array.isArray(profile.musical_interests) ? profile.musical_interests : [],
        talents: Array.isArray(profile.talents) ? profile.talents : [],
        country: profile.country ?? '',
        label: profile.label ?? '',
        points: profile.points ?? 5,
      });

      // Check if profile is complete
      const requiredFields: (keyof Profile)[] = ['stage_name', 'talents', 'musical_interests', 'country'];
      const isComplete = requiredFields.every(field => Boolean(profile[field]));
      setIsProfileComplete(isComplete);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      const updatedFields: (keyof Profile)[] = ['stage_name', 'talents', 'musical_interests', 'country'];
      const isComplete = updatedFields.every(field => {
        const value = formData[field];
        return Array.isArray(value) ? value.length > 0 : Boolean(value);
      });
      setIsProfileComplete(isComplete);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  // console.log('the profiles is complete', isProfileComplete);
  

  return (
    <Dialog open={!isProfileComplete} onOpenChange={() => {}} modal>
      <DialogContent
        className="sm:max-w-[425px] relative"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        hideCloseButton
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
              value={formData.stage_name || profile?.stage_name || ''}
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
              value={formData.label || profile?.label || ''}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Nom de votre label"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="activities" className="text-sm font-medium">
              Vous êtes
            </label>
            <MultiSelect
              options={TALENTS}
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
              options={MUSICAL_INTERESTS}
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
            <Button type="submit" disabled={sessionLoading}>
              {sessionLoading ? (
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
