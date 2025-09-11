'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'

interface LoginPromptProps {
  isOpen: boolean
  onClose: () => void
  action: string // "liker", "commenter", "partager", etc.
}

export default function LoginPrompt({ isOpen, onClose, action }: LoginPromptProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connexion requise</DialogTitle>
          <DialogDescription>
            Vous devez être connecté pour {action} cette publication.
            Rejoignez MiBuzz pour interagir avec la communauté !
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Continuer sans compte
          </Button>
          <Button asChild>
            <Link href="/auth/login">
              Se connecter
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/auth/register">
              Créer un compte
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
