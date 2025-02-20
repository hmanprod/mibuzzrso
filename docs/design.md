# Guide de Style - Interface Web Style BandLab

## 🎨 Vue d'ensemble
Une application web avec la même disposition que BandLab, comprenant :
- Barre de navigation en haut
- Menu latéral à gauche
- Fil d'actualité principal au centre
- Sidebar à droite pour les suggestions

## 📝 Typographie

### Police Principale
- Famille : `Roboto`, `Helvetica Neue`, ou `Arial` (sans-serif)
- Choix : Style sans-serif moderne, clair et lisible

### Hiérarchie des Tailles
| Élément | Taille | Poids |
|---------|---------|--------|
| H1 (Titre principal) | 24px | 700 (Bold) |
| H2 (Sous-titre) | 20px | 600 (Semi-Bold) |
| H3 (Titre de section) | 18px | 500 (Medium) |
| Corps du texte | 16px | 400 (Regular) |
| Texte secondaire | 14px | 400 (Regular) |

- Hauteur de ligne : 1.4 - 1.6

## 🎨 Palette de Couleurs

### Fonds
- Principal (body) : `#FFFFFF` ou `#FAFAFA`
- Sidebar gauche : transparent ou `rgba(255,255,255,0.5)`
- Zone de contenu : `#FFFFFF`
- Sidebar droite : `#F7F7F7`

### Textes
- Principal : `#333333` ou `#2D2D2D`
- Secondaire : `#666666` ou `#777777`
- Liens et éléments interactifs : `#FA4D4D`

### Accents et Boutons
- Fond des boutons d'action : `#FA4D4D`
- Texte des boutons : `#FFFFFF`
- Hover : `#E63F3F`
- Icônes : `#888888` ou `#666666`
- Séparateurs : `#EAEAEA`

## 📱 Composants UI

### Barre de Navigation (Header)
- Hauteur : 60-70px
- Fond : `#FFFFFF` ou `#F9F9F9`
- Structure :
  - Logo à gauche
  - Menu principal centré/gauche
  - Icônes utilisateur à droite
- Bouton "Create" :
  - Fond : `#FA4D4D`
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
  - Shadow : `0 1px 3px rgba(0,0,0,0.1)`
  - Border-radius : 4-6px
  - Padding : 16px
  - Espacement : 16px entre cartes

### Colonne de Droite
- Largeur : ~300px
- Fond : `#F9F9F9`
- Éléments :
  - Liste de suggestions
  - Boutons "Follow" : `#FA4D4D`

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
  - Principal : `#FA4D4D` (fond), `#FFFFFF` (texte)
  - Secondaire : `#F2F2F2` (fond), `#333333` (texte)

### Champs de Saisie
- Border : `1px solid #CCCCCC`
- Border-radius : 4px
- Padding : 8px 12px
- Focus : `1px solid #FA4D4D`

## 📏 Espacement

### Marges
- Feed : centré avec max-width
- Desktop :
  - Sidebar gauche : ~250px
  - Feed : ~700px
  - Sidebar droite : ~300px
- Espacement entre sections : ~24px
- Espacement vertical : 8-16px