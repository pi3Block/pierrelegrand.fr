

## Niveau 5 - Bureau Pierre (Joan's Portfolio Fork)

### Arcade Machine ✅ (Intégré)
- Fichiers créés dans `src/components/3d/pierre/apps/arcade/`
- Jeux : Snake, Tetris, Breakout convertis en TypeScript
- Intégré via `Html` de drei (pas d'iframe)
- Affichage sur la machine arcade 3D dans `ArcadeScreen.tsx`

### Joan OS ✅ (Intégré)
- Fichiers créés dans `src/components/3d/pierre/apps/os/`
- Composants : `JoanOS.tsx`, `WindowManager.ts`, `JoanOS.module.css`
- Simulation Windows avec :
  - Bureau avec icônes double-clic
  - Fenêtres déplaçables (drag & drop)
  - Menu Démarrer
  - Barre des tâches avec horloge
  - Fenêtres : About Me, Experience, Contact, Projects, Credits
- Affiché sur le **moniteur gauche** via `Html` de drei
- Inspiré de : `https://github.com/jrefusta/joan-os`

### Art Gallery ✅ (Intégré)
- Fichiers créés dans `src/components/3d/pierre/apps/gallery/`
- Composants : `ArtGallery.tsx`, `ArtGallery.module.css`
- Galerie virtuelle style musée avec :
  - Navigation entre les œuvres (flèches)
  - Cadres avec effet spotlight
  - Panel d'information avec tags et liens
  - Indicateurs de navigation
  - Clavier : ← → pour naviguer, ESC pour quitter
- Affiché sur le **moniteur droit** via `Html` de drei
- Inspiré de : `https://github.com/jrefusta/joan-art-gallery`

### Architecture Finale
```
src/components/3d/pierre/
├── apps/
│   ├── arcade/           # Jeux arcade (Snake, Tetris, Breakout)
│   ├── os/               # JoanOS - Simulation Windows
│   └── gallery/          # Art Gallery - Galerie virtuelle
├── elements/
│   ├── ArcadeScreen.tsx  # Machine arcade 3D + Html
│   └── MonitorScreen.tsx # Moniteurs 3D + Html (gauche: OS, droite: Gallery)
└── ...
```

