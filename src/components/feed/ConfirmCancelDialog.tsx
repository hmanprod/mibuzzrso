'use client';

import { Dialog, DialogContent, DialogTitle, DialogFooter } from '../ui/dialog';

interface ConfirmCancelDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isUploading?: boolean;
}

export default function ConfirmCancelDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  isUploading
}: ConfirmCancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-[18px] p-6">
        <DialogTitle className="text-lg font-semibold text-[#333333]">{title}</DialogTitle>
        <div className="mt-4">
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <DialogFooter className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
          >
            {isUploading ? 'Arrêter l\'upload' : 'Confirmer'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
