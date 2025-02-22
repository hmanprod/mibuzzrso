"use client";

import { useState } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Database } from '@/lib/supabase/database.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Profile = Database['public']['Tables']['profiles']['Row'];

const MUSICAL_ACTIVITIES = [
  'DJ',
  'Producer',
  'Beatmaker',
  'Singer',
  'Rapper',
  'Musician',
  'Sound Engineer',
];

const GENRES = [
  'Hip Hop',
  'R&B',
  'Pop',
  'Rock',
  'Electronic',
  'Jazz',
  'Classical',
  'Other',
];

export function OnboardingModal() {
  const { isModalOpen, closeModal, updateProfile } = useOnboarding();
  
  const [formData, setFormData] = useState<Partial<Profile>>({
    stage_name: '',
    genre: '',
    activities: [],
    country: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      closeModal();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="stageName" className="text-sm font-medium">
              Stage Name
            </label>
            <Input
              id="stageName"
              value={formData.stage_name}
              onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
              placeholder="Your artist name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="genre" className="text-sm font-medium">
              Primary Genre
            </label>
            <Select
              value={formData.genre}
              onValueChange={(value) => setFormData({ ...formData, genre: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((genre) => (
                  <SelectItem key={genre} value={genre.toLowerCase()}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="activities" className="text-sm font-medium">
              Activities
            </label>
            <Select
              value={formData.activities?.[0]}
              onValueChange={(value) => setFormData({ ...formData, activities: [value] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your main activity" />
              </SelectTrigger>
              <SelectContent>
                {MUSICAL_ACTIVITIES.map((activity) => (
                  <SelectItem key={activity} value={activity.toLowerCase()}>
                    {activity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="country" className="text-sm font-medium">
              Country
            </label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Your country"
              required
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Skip for now
            </Button>
            <Button type="submit">
              Complete Profile
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
