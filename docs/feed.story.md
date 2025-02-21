# 🎵 Fil d'actualité - User Stories

## 📝 Vue d'ensemble
Ce document décrit les fonctionnalités du fil d'actualité, incluant :
- Publication de contenus audio et vidéo
- Lecture et interaction avec les contenus
- Système de commentaires temporels
- Partage et interactions sociales

## 📮 Publication de contenu

### US-FEED-1: Publication audio
**En tant qu'** utilisateur connecté  
**Je veux** publier un fichier audio sur mon fil  
**Afin de** partager ma musique avec la communauté

**Critères d'acceptation :**
- Affichage d'un popup form comme sur bandlab
- Support des formats : MP3, WAV, AAC
- Limite de taille : 100MB maximum
- Champs requis :
  - Titre de la piste
  - Description (optionnelle)
  - Genre musical
  - Tags (optionnels)
- Visualisation de la forme d'onde audio comme sur SoundCloud
- Option pour définir une image de couverture
- Choix de la visibilité (public, privé, abonnés)

**Design :**
Voir le design de bandlab.com at /docs/examples/add-feed.png

### US-FEED-2: Publication vidéo
**En tant qu'** utilisateur connecté  
**Je veux** publier une vidéo musicale  
**Afin de** partager mes performances visuelles

**Critères d'acceptation :**
- Support des formats : MP4, MOV
- Limite de taille : 500MB maximum
- Génération automatique d'une miniature
- Option pour choisir une miniature personnalisée
- Mêmes options de métadonnées que l'audio
- Choix de la visibilité (public, privé, abonnés)

## 🎵 Lecture de contenu

### US-FEED-3: Lecteur audio avancé
**En tant qu'** utilisateur  
**Je veux** avoir un lecteur audio interactif style SoundCloud  
**Afin de** profiter pleinement du contenu audio

**Critères d'acceptation :**
- Affichage de la forme d'onde audio interactive
- Contrôles de lecture : play/pause, avance rapide, retour
- Affichage du temps écoulé/restant
- Contrôle du volume avec option mute
- Possibilité de cliquer sur la forme d'onde pour naviguer
- Marqueurs de commentaires visibles sur la forme d'onde
- Mode répétition et lecture automatique

### US-FEED-4: Lecteur vidéo
**En tant qu'** utilisateur  
**Je veux** avoir un lecteur vidéo complet  
**Afin de** visionner les contenus vidéo

**Critères d'acceptation :**
- Contrôles standards de lecture vidéo
- Option plein écran
- Qualité vidéo adaptative
- Affichage des commentaires en overlay
- Mode théâtre (fond sombre)

## 💬 Commentaires

### US-FEED-5: Commentaires temporels audio
**En tant qu'** utilisateur  
**Je veux** pouvoir commenter à un moment précis d'un audio  
**Afin de** donner un feedback contextuel

**Critères d'acceptation :**
- Possibilité de placer un commentaire à n'importe quel moment de la piste
- Marqueur visible sur la forme d'onde
- Le commentaire affiche :
  - Le timestamp
  - Le contenu du commentaire
  - L'auteur
  - La date
- Cliquer sur un commentaire lance la lecture à ce moment
- Option pour répondre aux commentaires
- Notifications pour l'auteur du contenu

### US-FEED-6: Commentaires vidéo
**En tant qu'** utilisateur  
**Je veux** commenter à un moment précis d'une vidéo  
**Afin de** réagir à des moments spécifiques

**Critères d'acceptation :**
- Similaire aux commentaires audio
- Marqueurs sur la timeline de la vidéo
- Option pour positionner le commentaire sur la vidéo (coordonnées x,y)

## 🔄 Interactions sociales

### US-FEED-7: Interactions basiques
**En tant qu'** utilisateur  
**Je veux** pouvoir interagir avec les publications  
**Afin de** montrer mon appréciation et partager

**Critères d'acceptation :**
- Like/Unlike
- Partage (réseaux sociaux, lien direct)
- Ajout aux favoris
- Option "Repost" style SoundCloud
- Compteurs d'interactions visibles

### US-FEED-8: Fil d'actualité personnalisé
**En tant qu'** utilisateur  
**Je veux** voir un fil d'actualité personnalisé  
**Afin de** découvrir du contenu pertinent

**Critères d'acceptation :**
- Affichage chronologique des publications
- Filtres par type de contenu (audio/vidéo)
- Filtres par genre musical
- Option "Tendances"
- Suggestions basées sur les intérêts
- Infinite scroll pour le chargement
