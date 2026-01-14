/**
 * Configuration centralisée de la galerie FPS procédurale.
 *
 * Toutes les dimensions et positions sont définies ici pour faciliter
 * la maintenance et les ajustements.
 */

export interface PedestalConfig {
  id: string
  position: [number, number, number]
  size: [number, number, number]
}

export interface PaintingSlot {
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
  size: [number, number]
}

export interface GalleryConfig {
  room: {
    width: number
    height: number
    depth: number
    wallThickness: number
  }
  door: {
    position: [number, number, number]
    rotation: [number, number, number]
    width: number
    height: number
  }
  pedestals: PedestalConfig[]
  paintingSlots: PaintingSlot[]
  playerSpawn: [number, number, number]
  colors: {
    floor: string
    ceiling: string
    walls: string
    pedestals: string
  }
}

export const GALLERY_CONFIG: GalleryConfig = {
  // Dimensions de la pièce
  room: {
    width: 12,        // X - largeur totale
    height: 4,        // Y - hauteur du plafond
    depth: 10,        // Z - profondeur totale
    wallThickness: 0.2,
  },

  // Porte de sortie (mur sud, côté droit)
  door: {
    position: [4, 0, 5],      // Sur le mur +Z (sud), côté droit
    rotation: [0, 0, 0],      // Face vers -Z (vers l'intérieur)
    width: 1.5,
    height: 2.5,
  },

  // Piédestaux au centre de la galerie
  pedestals: [
    { id: 'pedestal-1', position: [-2.5, 0.5, 0], size: [1.5, 1, 1.5] },
    { id: 'pedestal-2', position: [0, 0.5, -1.5], size: [2, 1, 1] },
    { id: 'pedestal-3', position: [2.5, 0.5, 0], size: [1.5, 1, 1.5] },
  ],

  // Emplacements des tableaux sur les murs
  paintingSlots: [
    // Mur Ouest (X = -6, face vers +X)
    { id: 'west-1', position: [-5.85, 2, 2.5], rotation: [0, Math.PI / 2, 0], size: [1.5, 1.2] },
    { id: 'west-2', position: [-5.85, 2, 0], rotation: [0, Math.PI / 2, 0], size: [1.5, 1.2] },
    { id: 'west-3', position: [-5.85, 2, -2.5], rotation: [0, Math.PI / 2, 0], size: [1.5, 1.2] },

    // Mur Est (X = +6, face vers -X)
    { id: 'east-1', position: [5.85, 2, 2.5], rotation: [0, -Math.PI / 2, 0], size: [1.5, 1.2] },
    { id: 'east-2', position: [5.85, 2, 0], rotation: [0, -Math.PI / 2, 0], size: [1.5, 1.2] },
    { id: 'east-3', position: [5.85, 2, -2.5], rotation: [0, -Math.PI / 2, 0], size: [1.5, 1.2] },

    // Mur Nord (Z = -5, face vers +Z)
    { id: 'north-1', position: [0, 2, -4.85], rotation: [0, 0, 0], size: [2, 1.5] },
  ],

  // Position de départ du joueur
  playerSpawn: [0, 1.6, 3],

  // Couleurs des éléments - Style galerie moderne
  colors: {
    floor: '#8a8a8a',     // Gris moyen (béton ciré)
    ceiling: '#e0e0e0',   // Gris très clair
    walls: '#c8c8c8',     // Gris clair
    pedestals: '#9a9a9a', // Gris moyen
  },
}

export default GALLERY_CONFIG
