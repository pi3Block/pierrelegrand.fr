/**
 * Point d'entrée pour la page Arcade standalone.
 * Cette page est affichée dans l'iframe de la borne d'arcade 3D.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ArcadeMachine } from '@components/3d/pierre/apps/arcade'

// Styles de base
const style = document.createElement('style')
style.textContent = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  html, body, #arcade-root {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
`
document.head.appendChild(style)

// Handler pour naviguer vers le Hub (communique avec le parent)
const handleNavigateToHub = () => {
  // Envoyer un message au parent pour naviguer vers le Hub
  window.parent.postMessage({ type: 'navigateToHub' }, '*')
}

ReactDOM.createRoot(document.getElementById('arcade-root')!).render(
  <React.StrictMode>
    <ArcadeMachine onNavigateToHub={handleNavigateToHub} />
  </React.StrictMode>
)
