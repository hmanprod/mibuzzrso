import React from "react";

export const metadata = {
  title: "Conditions Générales d’Utilisation | mibuzz.",
  description: "Consultez les conditions générales d’utilisation de la plateforme Challenge.MiBuzz.mg.",
};

import Image from 'next/image';
import Link from 'next/link';

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold mb-8 mt-[72px]">Conditions Générales d’Utilisation</h1>
          <div className="prose prose-gray max-w-none space-y-6 mx-auto">
            <div className="text-sm text-gray-500 mb-6">Dernière mise à jour : 20/05/2025</div>

            <section>
              <h2 className="text-xl font-semibold mb-2">Préambule</h2>
              <p>
                Les présentes Conditions Générales d&#39;Utilisation (ci-après « CGU ») régissent l&#39;accès et l&#39;utilisation de la plateforme Challenge.MiBuzz.mg (ci-après « la Plateforme »), opérée par MiBuzz SARL, à destination des beatmakers, discjockeys, artistes et administrateurs, ainsi que toute personne physique ou morale qui utilise la Plateforme (ci-après « l&#39;Utilisateur »).<br/>
                En accédant à la Plateforme et en l&#39;utilisant, l&#39;Utilisateur accepte sans réserve les présentes CGU.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">1. Objet de la Plateforme</h2>
              <p>
                La Plateforme challenge.mibuzz.mg permet aux Utilisateurs de participer à des remix challenges, de gérer leurs participations et d’uploader leurs créations musicales. Elle offre aussi des fonctionnalités d’administration et de suivi des performances pour les administrateurs.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">2. Inscription et Accès</h2>
              <h3 className="font-semibold mt-2">2.1 Inscription</h3>
              <p>
                Pour accéder aux fonctionnalités de la Plateforme, l’Utilisateur doit s’inscrire en fournissant les informations suivantes :
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Nom complet</li>
                <li>Adresse email valide</li>
                <li>Mot de passe sécurisé</li>
              </ul>
              <p>
                L&#39;Utilisateur garantit que les informations fournies sont exactes, complètes et mises à jour.
              </p>
              <h3 className="font-semibold mt-2">2.2 Connexion</h3>
              <p>
                L’accès à la Plateforme se fait via une connexion sécurisée à l’aide des identifiants (email et mot de passe) fournis lors de l’inscription.
              </p>
              <h3 className="font-semibold mt-2">2.3 Gestion de Compte</h3>
              <p>
                L’Utilisateur peut modifier ses informations personnelles ou supprimer son compte à tout moment via l’espace « Mon Profil ».<br/>
                La suppression définitive d’un compte entraîne la perte de l’accès à toutes les données associées.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">3. Participation aux Challenges</h2>
              <h3 className="font-semibold mt-2">3.1 Modalités de Participation</h3>
              <p>
                L’Utilisateur peut participer à des challenges en :
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Consultant la liste des challenges disponibles.</li>
                <li>Soumettant son remix via un upload sur la Plateforme et/ou en partageant un lien vers une publication sur les réseaux sociaux.</li>
              </ul>
              <h3 className="font-semibold mt-2">3.2 Validation des Participations</h3>
              <p>
                Les soumissions sont validées ou rejetées par les administrateurs en fonction de leur conformité aux règles du challenge.
              </p>
              <h3 className="font-semibold mt-2">3.3 Propriété Intellectuelle</h3>
              <p>
                L&apos;utilisateur conserve la propriété de ses créations soumises dans le cadre des challenges. Toutefois, il accorde à MiBuzz une licence non exclusive, mondiale et gratuite pour utiliser, promouvoir et diffuser ses remix dans le cadre de ces activités.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">4. Publication d&#39;une œuvre</h2>

              <h3 className="font-semibold mt-2">Modalités de publication</h3>
              <p>
                L&#39;Utilisateur peut publier son œuvre (musique, beat, remix) sur la Plateforme via l&#39;interface dédiée à cet effet. La publication doit respecter les formats et critères techniques précisés sur la Plateforme.
              </p>

              <h3 className="font-semibold mt-2">Validation des publications</h3>
              <p>
                Les œuvres publiées sont soumises à validation par les administrateurs afin de vérifier leur conformité aux présentes CGU et aux règles spécifiques de la Plateforme. MiBuzz se réserve le droit de refuser ou de retirer toute œuvre ne respectant pas ces critères.
              </p>

              <h3 className="font-semibold mt-2">Propriété intellectuelle</h3>
              <p>
                L&#39;Utilisateur conserve l&#39;entière propriété intellectuelle de ses œuvres publiées. Toutefois, il accorde à MiBuzz une licence non exclusive, mondiale et gratuite pour utiliser, promouvoir et diffuser l&#39;œuvre dans le cadre des activités de la Plateforme, tout en mentionnant l&#39;auteur lorsque cela est possible.
              </p>

              <h3 className="font-semibold mt-2">Responsabilité</h3>
              <p>
                L&#39;Utilisateur est seul responsable du contenu qu&#39;il publie, notamment en ce qui concerne le respect des droits d&#39;auteur et des droits des tiers. MiBuzz n&#39;est en aucun cas responsable des litiges, réclamations ou préjudices liés à la violation des droits de propriété intellectuelle par un Utilisateur. Il appartient à chaque Utilisateur de s&#39;assurer qu&#39;il détient les droits nécessaires sur les œuvres qu&#39;il diffuse via la Plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">5. Obligations de l’Utilisateur</h2>
              <ul className="list-disc pl-6 mt-1">
                <li>Ne pas soumettre de contenu contraire à la loi, aux bonnes mœurs ou aux droits des tiers.</li>
                <li>Respecter les droits d’auteur relatifs aux musiques utilisées dans les remix.</li>
                <li>Ne pas tenter d’accéder à des données ou services non autorisés sur la Plateforme.</li>
                <li>Maintenir la confidentialité de ses identifiants de connexion.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">6. Modération et Sanctions</h2>
              <h3 className="font-semibold mt-2">6.1 Modération</h3>
              <p>
                MiBuzz se réserve le droit de modérer tout contenu soumis sur la Plateforme afin d’assurer le respect des présentes CGU.
              </p>
              <h3 className="font-semibold mt-2">6.2 Sanctions</h3>
              <p>
                En cas de violation des CGU, MiBuzz pourra suspendre ou supprimer le compte de l’Utilisateur sans préavis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">7. Limitation de Responsabilité</h2>
              <p>
                MiBuzz ne saurait être tenu responsable des dommages directs ou indirects pouvant résulter de l&apos;utilisation de la Plateforme, notamment en cas de :
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Perte de données.</li>
                <li>Indisponibilité temporaire ou définitive de la Plateforme.</li>
                <li>Violations des droits d&apos;auteur liées aux contenus soumis par les Utilisateurs. Ces derniers sont seuls responsables de s&apos;assurer que leurs créations respectent les lois et les règlements applicables.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">8. Protection des Données Personnelles</h2>
              <p>
                Les données collectées sont traitées dans le respect de la loi n° 2014-004 sur la protection des données à Madagascar. L&apos;Utilisateur peut exercer ses droits d&apos;accès, de rectification ou de suppression en contactant MiBuzz à l&apos;adresse email suivante : <a href="mailto:hello@mibuzz.mg" className="text-indigo-600 hover:text-indigo-700">hello@mibuzz.mg</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">9. Modifications des CGU</h2>
              <p>
                MiBuzz se réserve le droit de modifier les présentes CGU à tout moment. Les modifications seront publiées sur la Plateforme, et l’Utilisateur devra les accepter pour continuer à utiliser les services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">10. Droit Applicable et Litiges</h2>
              <p>
                Les présentes CGU sont soumises au droit malgache. Tout litige relatif à leur interprétation ou à leur exécution sera de la compétence exclusive des juridictions de Madagascar.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">Contact</h2>
              <p>
                Pour toute question relative aux présentes CGU, vous pouvez contacter MiBuzz par email à l’adresse <a href="mailto:hello@mibuzz.mg" className="text-indigo-600 hover:text-indigo-700">hello@mibuzz.mg</a> ou via les réseaux sociaux.
              </p>
            </section>

            <div className="text-sm text-gray-500 mt-8 text-center">
              Dernière mise à jour : 20/05/2025
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
