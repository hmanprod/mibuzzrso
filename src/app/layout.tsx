import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { createClient } from '@/lib/supabase/server';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { SearchProvider } from '@/components/providers/SearchProvider';
import { Toaster } from '@/components/ui/toaster';
import { AuthDebug } from '@/components/debug/AuthDebug';
import { MediaControlProvider } from "@/components/providers/MediaControlProvider";

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: "mibuzz.",
  description: "Plateforme de partage musical",
  icons: {
    icon: [
      { url: '/images/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/favicon/favicon.ico' },
    ],
    apple: {
      url: '/images/favicon/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/images/favicon/android-chrome-192x192.png',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/images/favicon/android-chrome-512x512.png',
      },
    ],
  },
  manifest: '/images/favicon/site.webmanifest',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  

  return (
    <html lang="fr">
      <body className={`${roboto.variable} font-sans antialiased bg-[#FAFAFA] min-h-screen`}>
        <SessionProvider initialUser={session?.user ?? null}>
          <SearchProvider>
            <MediaControlProvider>
                {children} {/* Contenu de l'application */}
              <Toaster />
              {process.env.NODE_ENV === 'development' && <AuthDebug />}
            </MediaControlProvider>
          </SearchProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
