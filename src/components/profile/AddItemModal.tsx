"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MultiSelect, type Option } from "@/components/ui/multi-select";

interface AddItemModalProps {
  title: string;
  options: Option[];
  selectedItems: string[];
  onItemsChange: (items: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
}

export function AddItemModal({
  title,
  options,
  selectedItems,
  onItemsChange,
  isOpen,
  onClose,
  placeholder = "Sélectionner..."
}: AddItemModalProps) {
  const [localItems, setLocalItems] = useState<string[]>(selectedItems);

  // Update local state when selectedItems change or when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalItems(selectedItems);
    }
  }, [selectedItems, isOpen]);

  const handleSave = () => {
    onItemsChange(localItems);
    onClose();
  };

  const handleCancel = () => {
    setLocalItems(selectedItems); // Reset to original values
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <MultiSelect
            options={options}
            selected={localItems}
            onChange={setLocalItems}
            placeholder={placeholder}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
