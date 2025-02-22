import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { ProfileCheck } from "@/components/onboarding/ProfileCheck";

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: "RSO - Réseau Social Musical",
  description: "Plateforme de partage musical et social",
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
          </ProfileCheck>
        </Providers>
      </body>
    </html>
  );
}
