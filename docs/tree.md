# 🌳 Arborescence des Pages

## Structure du dossier `src/app`

```
src/app/
├── auth/
│   ├── login/
│   │   └── page.tsx           # Page de connexion
│   ├── register/
│   │   └── page.tsx           # Page d'inscription
│   └── reset-password/
│       ├── [token]/
│       │   └── page.tsx       # Page de création du nouveau mot de passe
│       └── page.tsx           # Page de demande de réinitialisation
├── favicon.ico                # Icône du site
├── globals.css               # Styles globaux
├── layout.tsx               # Layout principal de l'application
└── page.tsx                # Page d'accueil

```

## 📝 Description des routes

### Pages Principales
- `/` : Page d'accueil
  - Affiche le fil d'actualité musical
  - Sidebar droite avec suggestions

### Pages d'Authentification
- `/auth/login` : Connexion
  - Formulaire de connexion email/mot de passe
  - Connexion avec réseaux sociaux (Google, Facebook, Apple)
  
- `/auth/register` : Inscription
  - Formulaire d'inscription complet
  - Inscription avec réseaux sociaux
  - Validation des conditions d'utilisation
  
- `/auth/reset-password` : Réinitialisation du mot de passe
  - Étape 1 : Demande de réinitialisation par email
  - Étape 2 : Création du nouveau mot de passe (via `/auth/reset-password/[token]`)

## 🔄 Routes Dynamiques
- `/auth/reset-password/[token]`
  - Le paramètre `[token]` est utilisé pour valider le lien de réinitialisation
  - Accessible uniquement via le lien envoyé par email
