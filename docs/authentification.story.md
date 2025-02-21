# 🔐 Authentification - User Stories

## 📝 Vue d'ensemble
Ce document décrit les fonctionnalités d'authentification de l'application, incluant :
- Inscription par email/mot de passe
- Connexion par email/mot de passe
- Connexion avec Google
- Réinitialisation du mot de passe

## 👤 Inscription

### US-AUTH-1: Inscription par Email
**En tant que** nouvel utilisateur  
**Je veux** créer un compte avec mon email et un mot de passe  
**Afin de** pouvoir accéder à l'application

**Critères d'acceptation :**
- Le formulaire d'inscription doit contenir :
  - Nom d'utilisateur
  - Adresse email
  - Mot de passe
  - Confirmation du mot de passe
- Le mot de passe doit respecter les critères de sécurité :
  - Minimum 8 caractères
  - Au moins 1 majuscule
  - Au moins 1 chiffre
  - Au moins 1 caractère spécial
- L'email doit être validé via un lien de confirmation
- L'utilisateur doit accepter les conditions d'utilisation
- Message d'erreur clair si l'email est déjà utilisé

### US-AUTH-2: Inscription avec Google
**En tant que** nouvel utilisateur  
**Je veux** créer un compte avec mon compte Google  
**Afin de** m'inscrire rapidement sans avoir à créer un nouveau mot de passe

**Critères d'acceptation :**
- Bouton "Continuer avec Google" visible sur la page d'inscription
- Demande des autorisations nécessaires de Google
- Création automatique du compte avec les informations Google
- Redirection vers la page de complétion du profil si nécessaire

## 🔑 Connexion

### US-AUTH-3: Connexion par Email
**En tant qu'** utilisateur enregistré  
**Je veux** me connecter avec mon email et mot de passe  
**Afin d'** accéder à mon compte

**Critères d'acceptation :**
- Champs requis :
  - Email
  - Mot de passe
- Option "Se souvenir de moi"
- Lien vers la réinitialisation du mot de passe
- Message d'erreur clair en cas d'identifiants incorrects
- Verrouillage temporaire du compte après 5 tentatives échouées

### US-AUTH-4: Connexion avec Google
**En tant qu'** utilisateur enregistré  
**Je veux** me connecter avec mon compte Google  
**Afin d'** accéder rapidement à mon compte

**Critères d'acceptation :**
- Bouton "Continuer avec Google" visible sur la page de connexion
- Connexion automatique si le compte Google est déjà lié
- Message d'erreur si le compte Google n'est pas lié à un compte existant

## 🔄 Réinitialisation du mot de passe

### US-AUTH-5: Demande de réinitialisation
**En tant qu'** utilisateur ayant oublié son mot de passe  
**Je veux** demander une réinitialisation de mon mot de passe  
**Afin de** pouvoir récupérer l'accès à mon compte

**Critères d'acceptation :**
- Formulaire de demande avec champ email
- Email de réinitialisation envoyé avec lien sécurisé
- Message de confirmation d'envoi
- Le lien de réinitialisation expire après 1 heure
- Limitation des demandes à 3 par heure

### US-AUTH-6: Création du nouveau mot de passe
**En tant qu'** utilisateur avec un lien de réinitialisation  
**Je veux** définir un nouveau mot de passe  
**Afin de** pouvoir réaccéder à mon compte

**Critères d'acceptation :**
- Champs :
  - Nouveau mot de passe
  - Confirmation du nouveau mot de passe
- Mêmes critères de sécurité que pour l'inscription
- Confirmation de la modification réussie
- Déconnexion de toutes les sessions existantes
- Email de confirmation du changement
