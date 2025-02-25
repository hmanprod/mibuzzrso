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
│   ├── reset-password/
│   │   ├── [token]/
│   │   │   └── page.tsx       # Réinitialisation du mot de passe avec jeton
│   │   └── page.tsx           # Demande de réinitialisation du mot de passe
│   └── verify-email/
│       └── page.tsx           # Vérification de l'adresse e-mail
├── feed/
│   └── page.tsx               # Page de fil d'actualité
├── profile/
│   ├── edit/
│   │   └── page.tsx           # Page de modification du profil
│   └── page.tsx               # Page de profil
├── layout.tsx                 # Layout principal de l'application
├── globals.css                # Styles globaux
└── page.tsx                   # Page d'accueil (redirection vers /feed)
```

## Structure des composants

```
src/components/
├── auth/
│   ├── AuthGuard.tsx         # Protection des routes authentifiées
│   ├── AuthLayout.tsx        # Layout commun pour les pages d'auth
│   ├── SignInForm.tsx        # Formulaire de connexion
│   ├── SignUpForm.tsx        # Formulaire d'inscription
│   └── SocialButton.tsx      # Bouton de connexion sociale
├── debug/
│   └── AuthDebug.tsx         # Composant de débogage pour l'auth
├── feed/
│   ├── AudioPlayer.tsx       # Composant lecteur audio
│   ├── CreatePostBlock.tsx   # Bloc de création de publication
│   ├── CreatePostDialog.tsx  # Dialogue de création de publication
│   ├── FeedPost.tsx         # Composant de publication individuelle
│   └── VideoPlayer.tsx      # Composant lecteur vidéo
├── onboarding/
│   └── OnboardingModal.tsx   # Modal de flux d'intégration
├── providers/
│   └── Providers.tsx         # Wrapper des providers (Auth, etc.)
├── ui/
│   ├── Avatar.tsx           # Composant avatar
│   ├── badge.tsx            # Composant badge
│   └── button.tsx           # Composant bouton réutilisable
├── Feed.tsx                 # Composant de fil d'actualité principal
├── Navbar.tsx               # Barre de navigation
├── RightSidebar.tsx        # Composant de barre latérale droite
└── Sidebar.tsx             # Composant de barre latérale principale
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
  - Redirection automatique vers `/feed`

- `/feed` : Fil d'actualité
  - Affiche le fil d'actualité musical
  - Création de posts (audio/vidéo)
  - Sidebar gauche avec navigation
  - Sidebar droite avec suggestions
  - Protégée par AuthGuard

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

- `/auth/reset-password` : Réinitialisation du mot de passe
  - Demande de réinitialisation du mot de passe
  - Réinitialisation du mot de passe avec jeton
  
- `/auth/verify-email` : Vérification de l'adresse e-mail
  - Vérification de l'adresse e-mail

### Composants Principaux
- `AuthGuard` : Protège les routes authentifiées
  - Vérifie la présence d'un utilisateur connecté
  - Redirige vers la page de connexion si non authentifié
  - Intègre le modal d'onboarding si nécessaire
  - Utilisé directement dans les pages protégées

### Routes Protégées
Les routes suivantes nécessitent l'AuthGuard :
- `/feed` : Page principale du fil d'actualité
- `/profile` : Page de profil utilisateur
- `/profile/edit` : Page d'édition du profil

### Routes Publiques
Les routes suivantes sont accessibles sans authentification :
- `/auth/login` : Connexion
- `/auth/register` : Inscription
- `/auth/logout` : Déconnexion
- `/auth/verify-email` : Vérification email
- `/auth/reset-password` : Réinitialisation du mot de passe

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
Ces routes sont accessibles sans authentification. Elles sont gérées par le composant `AuthGuard`.

### Routes Protégées
Toutes les autres routes nécessitent une authentification. Si un utilisateur non authentifié tente d'y accéder, il sera redirigé vers `/auth/login`.

### Comportement
- Routes publiques : Affichage direct du contenu
- Routes protégées :
  - Sans utilisateur : Redirection vers login
  - Avec utilisateur : Affichage du contenu + modal d'onboarding si nécessaire
