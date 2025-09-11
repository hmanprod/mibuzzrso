'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Music } from 'lucide-react'

export default function AnonymousNavbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <Music className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              MiBuzz
            </span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Découvrez la musique sur MiBuzz
              </span>
            </div>
          </div>
          
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">
                Se connecter
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/register">
                S'inscrire
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </nav>
  )
}
