# Pierre Legrand - Portfolio 3D

Portfolio interactif 3D construit avec React Three Fiber, simulant un environnement Windows OS.

## Technologies

- **React 19** + **TypeScript**
- **React Three Fiber** - Rendu 3D
- **@pmndrs/uikit** - UI native 3D
- **Zustand** - State management
- **Three.js** - Moteur 3D
- **Vite** - Build tool

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Configuration

### EmailJS (Formulaire de contact)

Le formulaire de contact dans PierreOS utilise [EmailJS](https://www.emailjs.com/) pour l'envoi d'emails.

1. Créez un compte sur [emailjs.com](https://www.emailjs.com/)
2. Créez un **Service** (Gmail, Outlook, etc.)
3. Créez un **Template** avec les variables:
   - `{{name}}` - Nom de l'expéditeur
   - `{{email}}` - Email de l'expéditeur
   - `{{message}}` - Message
4. Configurez les variables d'environnement dans `.env.development` et `.env.production`:

```env
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
```

5. Décommentez le code EmailJS dans `src/components/3d/pierre/apps/os/PierreOSUikit.tsx`:

```tsx
// Dans la fonction handleSubmit de ContactContent:
import emailjs from '@emailjs/browser'

await emailjs.send(
  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  { name: form.name, email: form.email, message: form.message },
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY
)
```

## Fonctionnalités PierreOS

PierreOS est une simulation Windows OS en 3D avec les fonctionnalités suivantes:

### Fenêtres disponibles
- **About Me** - Profil et statistiques
- **Experience** - Timeline professionnelle
- **Contact** - Formulaire d'envoi d'emails avec validation
- **Projects** - Portfolio de projets
- **Credits** - Terminal interactif avec effet typing

### System Tray
- Icônes système (Wifi, Volume, Battery)
- Badge de notifications
- Bouton "Show Desktop" pour minimiser toutes les fenêtres

### Terminal Credits
- 4 sections navigables: Credits, Inspirations, Resources, Thanks
- Effet typing progressif (machine à écrire)
- Curseur clignotant animé
- Navigation par tabs ou boutons Prev/Next

### Formulaire Contact
- Validation en temps réel (nom, email, message)
- États visuels: idle, sending, success, error
- Intégration EmailJS prête

## Structure du projet

```
src/
├── components/
│   └── 3d/
│       └── pierre/
│           ├── apps/
│           │   ├── os/
│           │   │   ├── PierreOSUikit.tsx    # OS principal (uikit)
│           │   │   ├── PierreOS.tsx         # Version HTML
│           │   │   └── WindowManager.ts     # Gestionnaire de fenêtres
│           │   └── gallery/
│           │       └── ArtGalleryUikit.tsx  # Galerie d'art
│           ├── elements/                     # Éléments 3D
│           ├── PierreExperience.tsx         # Expérience principale
│           ├── PierreScene.tsx              # Scène 3D
│           └── PierreWorld.tsx              # Monde 3D
├── hooks/
│   └── useResponsive.ts                     # Hooks responsive
├── stores/
│   └── pierreStore.ts                       # État global
└── App.tsx
```

## Crédits

Inspiré par:
- [Joan OS](https://github.com/jrefusta/joan-os) - jrefusta
- [Three.js Journey](https://threejs-journey.com/) - Bruno Simon
- [Poimandres](https://github.com/pmndrs) - Écosystème R3F

## Licence

MIT
