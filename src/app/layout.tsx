import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { ProfileCheck } from "@/components/ProfileCheck";
import { AuthDebug } from '@/components/debug/AuthDebug';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${roboto.variable} font-sans antialiased bg-[#FAFAFA] min-h-screen`}>
        <Providers>
          <ProfileCheck>
            {children} {/* Contenu de l'application */}
            {process.env.NODE_ENV === 'development' && <AuthDebug />}
          </ProfileCheck>
        </Providers>
      </body>
    </html>
  );
}
