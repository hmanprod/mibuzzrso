import React from "react";

export const metadata = {
  title: "Politique de confidentialité | mibuzz.",
  description: "Consultez la politique de confidentialité de mibuzz.",
};

import Image from 'next/image';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <>
      <header className="bg-white border-b border-[#EAEAEA] h-[60px]">
        <div className="max-w-[1300px] mx-auto px-6 h-full flex items-center justify-start">
          <Link href="/">
            <Image
              src="/images/logo_black.svg"
              alt="MIBUZZ Logo"
              width={130}
              height={45}
              priority
            />
          </Link>
        </div>
      </header>
      <div className="max-w-[1300px] mx-auto px-6">
        <main>
          <h1 className="text-3xl font-bold mb-8 mt-[72px]">Politique de Confidentialité</h1>
          <div className="prose prose-gray max-w-none space-y-6 mx-auto">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Collecte des Informations</h2>
              <p>Nous collectons les informations suivantes :</p>
              <ul className="list-disc pl-6 space-y-2 pt-2">
                <li>Informations de profil (nom, prénom, nom de scène)</li>
                <li>Coordonnées (email, numéro de téléphone)</li>
                <li>Liens vers vos réseaux sociaux</li>
                <li>Contenu musical que vous partagez</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4">2. Utilisation des Informations</h2>
              <p>Nous utilisons vos informations pour :</p>
              <ul className="list-disc pl-6 space-y-2 pt-2">
                <li>Gérer votre compte et votre profil</li>
                <li>Vous permettre de participer aux challenges</li>
                <li>Communiquer avec vous concernant les événements et mises à jour</li>
                <li>Améliorer nos services</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4">3. Protection des Données</h2>
              <p>
                Nous prenons la sécurité de vos données très au sérieux. Vos informations sont
                stockées de manière sécurisée et nous utilisons des protocoles de chiffrement
                pour protéger vos données personnelles.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4">4. Partage des Informations</h2>
              <p>
                Nous ne partageons vos informations personnelles qu&apos;avec votre consentement
                explicite ou lorsque cela est nécessaire pour fournir nos services.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4">5. Vos Droits</h2>
              <p>Vous avez le droit de :</p>
              <ul className="list-disc pl-6 space-y-2 pt-2">
                <li>Accéder à vos données personnelles</li>
                <li>Corriger vos informations</li>
                <li>Supprimer votre compte</li>
                <li>Retirer votre consentement</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4">6. Cookies</h2>
              <p>
                Nous utilisons des cookies pour améliorer votre expérience sur notre plateforme.
                Vous pouvez contrôler les cookies via les paramètres de votre navigateur.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4">7. Contact</h2>
              <p>
                Pour toute question concernant notre politique de confidentialité,
                contactez-nous à{' '}
                <a 
                  href="mailto:hello@mibuzz.mg"
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  hello@mibuzz.mg
                </a>
              </p>
            </section>
            <div className="text-sm text-gray-500 mt-8 text-center">
              Dernière mise à jour : {new Date().toLocaleDateString()}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
