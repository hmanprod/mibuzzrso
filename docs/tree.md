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
│   ├── [id]/
│   │   └── page.tsx           # Page de profil d'un utilisateur
│   ├── edit/
│   │   └── page.tsx           # Page de modification du profil
│   ├── AddItemModal.tsx      # Modal pour ajouter des items (talents, genres)
│   └── Profile.tsx           # Composant d'affichage de profil
├── layout.tsx                 # Layout principal de l'application
├── globals.css                # Styles globaux
└── page.tsx                   # Page d'accueil (redirection vers /feed)
```

# 📋 Liste des Composants et Actions

## Composants d'Interface Utilisateur (`src/components/ui`)

| Composant | Description | Actions |
|-----------|-------------|---------|
| `Avatar.tsx` | Affiche l'avatar d'un utilisateur | Affiche l'image de profil avec fallback |
| `TimeAgo.tsx` | Affiche le temps écoulé | Formate et affiche le temps écoulé depuis une date |
| `badge.tsx` | Badge pour étiquettes | Affiche des badges stylisés |
| `button.tsx` | Bouton personnalisé | Gère les interactions utilisateur (clic) |
| `dialog.tsx` | Fenêtre modale | Affiche une boîte de dialogue modale |
| `input.tsx` | Champ de saisie | Capture les entrées utilisateur |
| `loading.tsx` | Indicateur de chargement | Affiche un état de chargement |
| `multi-select.tsx` | Sélection multiple | Permet de sélectionner plusieurs options |
| `not-found.tsx` | Page non trouvée | Affiche un message d'erreur 404 |
| `select.tsx` | Menu déroulant | Permet de sélectionner une option |
| `toast.tsx` | Notification toast | Affiche des notifications temporaires |

## Composants d'Authentification (`src/components/auth`)

| Composant | Description | Actions |
|-----------|-------------|---------|
| `AuthGuard.tsx` | Protection des routes | Vérifie si l'utilisateur est authentifié |
| `AuthLayout.tsx` | Layout pour pages d'auth | Structure les pages d'authentification |
| `SocialButton.tsx` | Bouton de connexion sociale | Permet la connexion via réseaux sociaux |

## Composants de Flux (`src/components/feed`)

| Composant | Description | Actions |
|-----------|-------------|---------|
| `FeedPost.tsx` | Publication dans le flux | Affiche une publication avec médias et interactions |
| | | Permet de liker une publication |
| | | Affiche/masque les commentaires |
| | | Partage une publication |
| `AudioPlayer.tsx` | Lecteur audio | Lecture/pause de l'audio |
| | | Affichage de la forme d'onde |
| | | Contrôle du volume |
| | | Navigation dans la piste |
| | | Comptage des lectures |
| `VideoPlayer.tsx` | Lecteur vidéo | Lecture/pause de la vidéo |
| | | Contrôle du volume |
| | | Mode plein écran |
| | | Navigation dans la vidéo |
| | | Comptage des lectures |
| `CommentSection.tsx` | Section commentaires | Affichage des commentaires |
| | | Ajout de nouveaux commentaires |
| | | Réponse aux commentaires |
| | | Like des commentaires |
| | | Navigation vers un timestamp spécifique |
| `CreatePostBlock.tsx` | Bloc de création de post | Interface pour créer un nouveau post |
| `CreatePostDialog.tsx` | Modal de création de post | Formulaire complet pour créer un post |
| `FeedPostSkeleton.tsx` | Placeholder de chargement | Affiche un état de chargement pour les posts |

## Composants de Profil (`src/components/profile`)

| Composant | Description | Actions |
|-----------|-------------|---------|
| `Profile.tsx` | Affichage de profil | Affiche les informations du profil |
| | | Affiche les posts de l'utilisateur |
| | | Filtrage par type de média (audio/vidéo) |
| | | Modification de l'avatar/photo de couverture |
| `AvatarUploadModal.tsx` | Modal d'upload d'avatar | Permet de télécharger et recadrer l'avatar |
| `CoverPhotoUploadModal.tsx` | Modal d'upload de couverture | Permet de télécharger et recadrer la photo de couverture |
| `ProfileSkeleton.tsx` | Placeholder de chargement | Affiche un état de chargement pour le profil |
| `AddItemModal.tsx` | Modal d'ajout d'éléments | Permet d'ajouter des talents, genres, etc. |

## Composants d'Onboarding (`src/components/onboarding`)

| Composant | Description | Actions |
|-----------|-------------|---------|
| `OnboardingModal.tsx` | Modal d'intégration | Guide l'utilisateur lors de sa première connexion |

## Actions Serveur (`src/app/feed/actions`)

### Actions d'Interaction (`interaction.ts`)

| Action | Description |
|--------|-------------|
| `getCommentsByMediaId` | Récupère les commentaires pour un média |
| `addComment` | Ajoute un commentaire à un média |
| `likeComment` | Like/unlike un commentaire |
| `getCommentLikes` | Récupère les likes d'un commentaire |
| `togglePostLike` | Like/unlike une publication |
| `markMediaAsRead` | Marque un média comme lu/écouté |
| `getMediaReadsCount` | Récupère le nombre de lectures d'un média |

### Actions de Publication (`post.ts`)

| Action | Description |
|--------|-------------|
| `getPosts` | Récupère les publications pour le flux |
| `getProfilePosts` | Récupère les publications d'un profil spécifique |

## Intégrations Externes

| Service | Utilisation |
|---------|-------------|
| `Supabase` | Base de données et authentification |
| `Cloudinary` | Stockage et traitement des médias (images, audio, vidéo) |
| `TailwindCSS` | Styling des composants |
| `NextJS` | Framework React avec rendu côté serveur |

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
│   ├── Providers.tsx        # Wrapper des providers globaux
│   └── SessionProvider.tsx   # Provider de gestion de session
├── ui/
│   ├── Avatar.tsx           # Composant avatar
│   ├── badge.tsx            # Composant badge
│   ├── button.tsx           # Composant bouton réutilisable
│   ├── command.tsx          # Composant de commande
│   ├── dialog.tsx           # Composant de dialogue modal
│   ├── input.tsx            # Composant de champ de saisie
│   ├── multi-select.tsx     # Composant de sélection multiple
│   ├── popover.tsx          # Composant de popover
│   ├── select.tsx           # Composant de sélection
│   ├── toast.tsx            # Composant de notification toast
│   ├── toaster.tsx          # Gestionnaire de toasts
│   └── use-toast.ts         # Hook de gestion des toasts
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

## Structure des constantes

```
src/constants/
├── options/
│   ├── countries.ts         # Liste des pays (ALL_COUNTRIES, INDIAN_OCEAN_COUNTRIES)
│   ├── genres.ts            # Liste des genres musicaux (MUSICAL_INTERESTS)
│   ├── talents.ts           # Liste des talents (TALENTS)
│   └── index.ts             # Export centralisé des constantes
└── routes.ts                # Constantes des routes de l'application
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

### Pages de Profil
- `/profile/[id]` : Page de profil utilisateur
  - Affiche les informations du profil (nom, bio, label, etc.)
  - Affiche les intérêts musicaux et talents
  - Affiche les liens sociaux
  - Affiche les posts de l'utilisateur
  - Protégée par AuthGuard

- `/profile/edit` : Page d'édition du profil
  - Modification des informations personnelles
  - Upload de photo de profil et de couverture
  - Gestion des intérêts musicaux et talents
  - Gestion des liens sociaux
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

- `AddItemModal` : Composant modal réutilisable pour la sélection d'items
  - Utilisé pour ajouter des talents et des genres musicaux
  - Interface utilisateur intuitive avec MultiSelect
  - Remplace les prompts natifs du navigateur
  - Permet la sélection multiple d'items

### Constantes et Options
- `TALENTS` : Liste des talents disponibles
  - Utilisé dans les formulaires de profil et l'onboarding
  - Structure: `{ label: string, value: string }[]`

- `MUSICAL_INTERESTS` : Liste des genres musicaux
  - Utilisé dans les formulaires de profil et l'onboarding
  - Structure: `{ label: string, value: string }[]`

- `ALL_COUNTRIES` et `INDIAN_OCEAN_COUNTRIES` : Listes des pays
  - Utilisées dans les sélecteurs de pays
  - Les pays de l'Océan Indien sont mis en avant
  - Structure: `{ label: string, value: string }[]`

### Routes Protégées
Les routes suivantes nécessitent l'AuthGuard :
- `/feed` : Page principale du fil d'actualité
- `/profile/[id]` : Page de profil utilisateur
- `/profile/edit` : Page d'édition du profil

### Routes Publiques
```typescript
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/logout',
  '/auth/register',
  '/auth/verify-email',
  '/auth/reset-password',
  '/auth/callback/google',
  '/auth/confirm'
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
