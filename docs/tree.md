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
├── favicon.ico                # Icône du site
├── globals.css               # Styles globaux
├── layout.tsx               # Layout principal de l'application
└── page.tsx                # Page d'accueil

```

## Structure des composants

```
src/components/
├── auth/
│   ├── AuthGuard.tsx        # Protection des routes authentifiées
│   ├── AuthLayout.tsx       # Layout commun pour les pages d'auth
│   └── SocialButton.tsx     # Bouton de connexion sociale
├── providers/
│   └── Providers.tsx        # Wrapper des providers (Auth, etc.)
└── ...autres composants
```

## Structure des hooks

```
src/hooks/
└── useAuth.tsx             # Hook de gestion de l'authentification
```

## Structure de la configuration

```
src/lib/
└── supabase.ts            # Configuration du client Supabase
```

## 📝 Description des routes

### Pages Principales
- `/` : Page d'accueil
  - Affiche le fil d'actualité musical
  - Sidebar droite avec suggestions
  - Protégée par AuthGuard (redirection vers /auth/login si non connecté)

### Pages d'Authentification
- `/auth/login` : Connexion
  - Formulaire de connexion email/mot de passe
  - Connexion avec réseaux sociaux (Google, Facebook, Apple)
  - Vérification de l'état de confirmation de l'email
  
- `/auth/register` : Inscription
  - Formulaire d'inscription complet
  - Inscription avec réseaux sociaux
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

## 🔒 Système d'Authentification

### Composants
- `AuthGuard` : Protège les routes authentifiées
  - Vérifie la présence d'un utilisateur connecté
  - Redirige vers la page de connexion si nécessaire
  - Affiche un loader pendant la vérification

- `Providers` : Fournit le contexte d'authentification
  - Enveloppe l'application avec AuthProvider
  - Gère l'état global de l'authentification

### Hooks
- `useAuth` : Hook personnalisé pour l'authentification
  - Gestion de la connexion/déconnexion
  - Accès aux informations de l'utilisateur
  - Mise à jour du profil utilisateur
  - Gestion de la vérification d'email
