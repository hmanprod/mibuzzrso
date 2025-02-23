# 🌳 Arborescence des Pages

## Structure du dossier `src/app`

```
src/app/
├── auth/
│   ├── login/
│   │   └── page.tsx           # Page de connexion
│   ├── register/
│   │   └── page.tsx           # Page d'inscription
│   ├── logout/
│   │   └── page.tsx           # Page de déconnexion
│   └── callback/
│       └── google/
│           └── page.tsx       # Callback pour l'auth Google
├── layout.tsx                 # Layout principal de l'application
├── globals.css                # Styles globaux
└── page.tsx                   # Page d'accueil
```

## Structure des composants

```
src/components/
├── auth/
│   ├── AuthLayout.tsx        # Layout commun pour les pages d'auth
│   └── SocialButton.tsx      # Bouton de connexion sociale
├── debug/
│   └── AuthDebug.tsx         # Composant de debug pour l'auth
├── providers/
│   └── Providers.tsx         # Wrapper des providers (Auth, etc.)
├── ui/
│   └── button.tsx            # Composant bouton réutilisable
└── ProfileCheck.tsx          # Vérification de la complétude du profil
```

## Structure des hooks

```
src/hooks/
├── useAuth.tsx              # Hook de gestion de l'authentification
└── useOnboarding.tsx        # Hook de gestion de l'onboarding
```

## Structure de la configuration

```
src/lib/
└── supabase.ts             # Configuration du client Supabase
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
  - Connexion avec Google
  - Gestion des erreurs de connexion
  
- `/auth/register` : Inscription
  - Formulaire d'inscription
  - Inscription avec Google
  - Gestion des erreurs d'inscription
  
- `/auth/logout` : Déconnexion
  - Confirmation de déconnexion
  - Gestion du loading state
  - Redirection vers login

- `/auth/callback/google` : Callback Google
  - Gestion du retour de l'authentification Google
  - Redirection après authentification réussie

### Composants Principaux
- `ProfileCheck` : Protection et vérification du profil
  - Gestion des routes publiques/privées
  - Redirection vers login si non authentifié
  - Affichage du modal d'onboarding si nécessaire

- `AuthDebug` : Composant de débogage
  - Affichage des informations de l'utilisateur connecté
  - Visible uniquement en développement
  - Fermable manuellement

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

## 🔐 Gestion des Routes

### Routes Publiques
```typescript
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/logout',
  '/auth/register',
  '/auth/verify-email',
  '/auth/reset-password',
  '/auth/callback/google'
];
```
Ces routes sont accessibles sans authentification. Elles sont gérées par le composant `ProfileCheck`.

### Routes Protégées
Toutes les autres routes nécessitent une authentification. Si un utilisateur non authentifié tente d'y accéder, il sera redirigé vers `/auth/login`.

### Comportement
- Routes publiques : Affichage direct du contenu
- Routes protégées :
  - Sans utilisateur : Redirection vers login
  - Avec utilisateur : Affichage du contenu + modal d'onboarding si nécessaire
