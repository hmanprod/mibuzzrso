# 👋 Onboarding - User Stories

## 📝 Vue d'ensemble
Ce document décrit le processus d'onboarding des nouveaux utilisateurs après leur première connexion, incluant :
- Vérification de la complétude du profil
- Collecte des informations essentielles
- Options de personnalisation du profil

## 🔍 Vérification du Profil

### US-ONB-1: Vérification de la Complétude
**En tant que** système  
**Je veux** vérifier si le profil de l'utilisateur est complet  
**Afin de** garantir une expérience utilisateur optimale

**Critères d'acceptation :**
- Vérification des champs requis :
  - Nom de scène (stage_name)
  - Genre musical (genre)
  - Activités (activities)
  - Pays (country)
- Déclenchement automatique après la connexion
- Redirection vers le popup d'onboarding si incomplet

## 🎵 Popup d'Onboarding

### US-ONB-2: Collecte des Informations Essentielles
**En tant qu'** utilisateur nouvellement connecté  
**Je veux** compléter les informations essentielles de mon profil  
**Afin de** personnaliser mon expérience sur la plateforme

**Critères d'acceptation :**
- Affichage d'un popup modal
- Champs requis à remplir :
  - Nom de scène (stage_name)
  - Genre musical principal (genre)
  - Activités musicales (activities)
  - Pays (country)
- Validation des champs en temps réel
- Messages d'erreur clairs et informatifs
- Progression étape par étape
- Impossibilité de passer sans remplir les champs requis

### US-ONB-3: Options de Finalisation
**En tant qu'** utilisateur  
**Je veux** avoir le choix de compléter ou non mon profil  
**Afin de** personnaliser mon expérience selon mes préférences

**Critères d'acceptation :**
- Deux options clairement présentées :
  1. "Modifier mon profil" :
     - Redirige vers la page d'édition complète du profil
     - Permet une personnalisation plus poussée
  2. "Continuer" :
     - Ferme le popup
     - Sauvegarde les informations déjà renseignées
- Boutons visuellement distincts
- Confirmation de sauvegarde des données
- Possibilité de revenir modifier le profil plus tard

## 🔄 Flux de Navigation

### US-ONB-4: Gestion de la Navigation
**En tant que** système  
**Je veux** gérer le flux de navigation pendant l'onboarding  
**Afin d'** assurer une expérience fluide

**Critères d'acceptation :**
- Impossibilité de fermer le popup sans action
- Sauvegarde automatique des informations
- Redirection appropriée selon le choix :
  - Vers la page d'édition du profil
  - Vers la page précédente/dashboard
- Mémorisation de l'état d'onboarding
- Non réaffichage du popup après complétion

## 💾 Persistance des Données

### US-ONB-5: Sauvegarde des Informations
**En tant que** système  
**Je veux** sauvegarder les informations d'onboarding  
**Afin de** maintenir la cohérence des données utilisateur

**Critères d'acceptation :**
- Sauvegarde dans la table profiles :
  - Mise à jour des champs requis
  - Horodatage de la modification
  - Gestion des erreurs de sauvegarde
- Validation côté serveur
- Notification de succès/échec
- Journalisation des modifications
