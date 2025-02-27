# Guide de Style - Interface Web Style BandLab

## 🎨 Vue d'ensemble
Une application web avec la même disposition que BandLab, comprenant :
- Barre de navigation en haut
- Menu latéral à gauche
- Fil d'actualité principal au centre
- Sidebar à droite pour les suggestions

## 📝 Typographie

### Police Principale
- Famille : `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI` (sans-serif)
- Choix : Utilisation des polices système natives pour une meilleure performance et cohérence

### Hiérarchie des Tailles
| Élément | Taille | Poids |
|---------|---------|--------|
| H1 (Titre principal) | 24px | 700 (Bold) |
| H2 (Sous-titre) | 20px | 600 (Semi-Bold) |
| H3 (Titre de section) | 18px | 500 (Medium) |
| Corps du texte | 16px | 400 (Regular) |
| Menu de navigation | 14px | 400 (Regular) |
| Texte secondaire | 14px | 400 (Regular) |

## 🎨 Palette de Couleurs

- Primaire : `#E94135`

### Fonds
- Principal (body) : `#FFFFFF` ou `#FAFAFA`
- Sidebar gauche : transparent ou `rgba(255,255,255,0.5)`
- Zone de contenu : `#FFFFFF`
- Sidebar droite : `#F7F7F7`

### Textes
- Principal : `#333333` ou `#2D2D2D`
- Secondaire : `#666666` ou `#777777`
- Liens et éléments interactifs : `#E94135`

### Accents et Boutons
- Fond des boutons d'action : `#E94135`
- Texte des boutons : `#FFFFFF`
- Hover : `#E63F3F`
- Icônes : `#888888` ou `#666666`
- Séparateurs : `#EAEAEA`

## 📱 Composants UI

### Barre de Navigation (Header)
- Hauteur : 60px
- Fond : `#FFFFFF`
- Structure :
  - Logo à gauche (20px)
  - Menu principal avec boutons arrondis (18px border-radius)
  - Icônes utilisateur à droite
- Menu principal :
  - Taille de police : 14px
  - Border-radius : 18px
  - Padding : 8px 16px
  - Hover : Changement de couleur du texte
- Bouton "Create" :
  - Fond : `#E94135`
  - Border-radius : 4px
  - Padding : 8px 16px

### Menu Latéral Gauche
- Largeur : 220-250px
- Fond : transparent
- Éléments :
  - Liste verticale
  - Icônes à gauche + texte
  - Hover : `#F2F2F2`

### Section Centrale (Feed)
- Largeur max : 700-800px
- Cartes (posts) :
  - Fond : `#FFFFFF`
  - Shadow : `shadow-sm`
  - Border-radius : 18px
  - Padding : 16px
  - Espacement : 16px entre cartes

### Colonne de Droite
- Largeur : ~300px
- Fond : `#F9F9F9`
- Éléments :
  - Liste de suggestions
  - Boutons "Follow" : `#E94135`

## 📱 Responsive Design

### Mobile (<768px)
- Sidebar gauche : menu hamburger
- Section centrale : 100% largeur
- Sidebar droite : masquée/bas de page

### Tablette (768-1024px)
- Sidebar gauche : réduite
- Feed : centré
- Sidebar droite : sous le feed

## 🔧 Éléments Interactifs

### Boutons Standards
- Border : none
- Border-radius : 4px
- Couleurs :
  - Principal : `#E94135` (fond), `#FFFFFF` (texte)
  - Secondaire : `#F2F2F2` (fond), `#333333` (texte)

### Champs de Saisie
- Border : `1px solid #CCCCCC`
- Border-radius : 4px
- Padding : 8px 12px
- Focus : `1px solid #E94135`

## 📏 Espacement

### Marges
- Feed : centré avec max-width
- Desktop :
  - Sidebar gauche : ~250px
  - Feed : ~700px
  - Sidebar droite : ~300px
- Espacement entre sections : ~24px
- Espacement vertical : 8-16px