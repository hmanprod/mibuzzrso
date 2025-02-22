# 🌳 Arborescence des Pages

## Structure du dossier `src/app`

```
src/app/
├── auth/
│   ├── login/
│   │   └── page.tsx           # Page de connexion
│   ├── register/
│   │   └── page.tsx           # Page d'inscription
│   ├── verify-email/
│   │   └── page.tsx           # Page de vérification d'email
│   └── reset-password/
│       ├── [token]/
│       │   └── page.tsx       # Page de création du nouveau mot de passe
│       └── page.tsx           # Page de demande de réinitialisation
├── profile/
│   ├── edit/
│   │   └── page.tsx           # Page d'édition du profil
│   └── page.tsx               # Page de profil utilisateur
├── favicon.ico                # Icône du site
├── globals.css                # Styles globaux
├── layout.tsx                 # Layout principal de l'application
└── page.tsx                   # Page d'accueil
```

## Structure des composants

```
src/components/
├── auth/
│   ├── AuthGuard.tsx         # Protection des routes authentifiées
│   ├── AuthLayout.tsx        # Layout commun pour les pages d'auth
│   └── SocialButton.tsx      # Bouton de connexion sociale
├── onboarding/
│   ├── OnboardingModal.tsx   # Modal d'onboarding
│   ├── ProfileCheck.tsx      # Vérification de la complétude du profil
│   └── OnboardingForm.tsx    # Formulaire de collecte d'informations
├── providers/
│   ├── Providers.tsx         # Wrapper des providers (Auth, etc.)
│   └── OnboardingProvider.tsx # Gestion de l'état d'onboarding
└── ...autres composants
```

## Structure des hooks

```
src/hooks/
├── useAuth.tsx              # Hook de gestion de l'authentification
├── useOnboarding.tsx        # Hook de gestion de l'onboarding
└── useProfile.tsx           # Hook de gestion du profil utilisateur
```

## Structure de la configuration

```
src/lib/
├── supabase/
│   ├── client.ts           # Configuration du client Supabase
│   ├── database.types.ts   # Types générés pour la base de données
│   └── schema.ts           # Schémas de validation
└── utils/
    └── profile.ts          # Utilitaires de gestion du profil
```

## Structure des migrations

```
supabase/
├── migrations/
│   ├── 20250222125247_create_profiles.sql
│   ├── 20250222125248_create_challenges.sql
│   └── 20250222125249_create_challenge_participations.sql
└── seed.sql                # Données initiales
```

## 📝 Description des routes

### Pages Principales
- `/` : Page d'accueil
  - Affiche le fil d'actualité musical
  - Sidebar droite avec suggestions
  - Protégée par AuthGuard (redirection vers /auth/login si non connecté)
  - Vérification de la complétude du profil

### Pages d'Authentification
- `/auth/login` : Connexion
  - Formulaire de connexion email/mot de passe
  - Connexion avec réseaux sociaux (Google)
  - Vérification de l'état de confirmation de l'email
  - Déclenchement de l'onboarding si nécessaire
  
- `/auth/register` : Inscription
  - Formulaire d'inscription complet
  - Inscription avec Google
  - Validation des conditions d'utilisation
  - Redirection vers la page de vérification d'email
  
- `/auth/verify-email` : Vérification d'email
  - Affichage du statut de vérification
  - Option de renvoi de l'email de confirmation
  - Redirection vers la connexion après confirmation
  
- `/auth/reset-password` : Réinitialisation du mot de passe
  - Étape 1 : Demande de réinitialisation par email
  - Étape 2 : Création du nouveau mot de passe (via `/auth/reset-password/[token]`)

## 🔄 Routes Dynamiques
- `/auth/reset-password/[token]`
  - Le paramètre `[token]` est utilisé pour valider le lien de réinitialisation
  - Accessible uniquement via le lien envoyé par email

## 🔒 Système d'Authentification et Onboarding

### Composants
- `AuthGuard` : Protège les routes authentifiées
  - Vérifie la présence d'un utilisateur connecté
  - Redirige vers la page de connexion si nécessaire
  - Affiche un loader pendant la vérification
  - Déclenche la vérification du profil

- `Providers` : Fournit les contextes
  - AuthProvider pour l'authentification
  - OnboardingProvider pour l'état d'onboarding
  - Gestion des états globaux

### Hooks
- `useAuth` : Hook d'authentification
  - Gestion de la connexion/déconnexion
  - Accès aux informations de l'utilisateur
  - Mise à jour du profil utilisateur
  - Gestion de la vérification d'email

- `useOnboarding` : Hook d'onboarding
  - Vérification de la complétude du profil
  - Gestion du modal d'onboarding
  - Sauvegarde des informations
  - Navigation post-onboarding
