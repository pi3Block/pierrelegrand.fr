/**
 * Serveur Express pour servir l'application Vite en production
 * Utilisé pour le déploiement sur Hostinger Node.js
 */
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Chemin vers le build Vite
const distPath = join(__dirname, 'dist');

// Vérification que le build existe
if (!existsSync(distPath)) {
  console.error('❌ Le dossier dist/ n\'existe pas. Exécutez "npm run build" d\'abord.');
  process.exit(1);
}

// Servir les fichiers statiques avec cache
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: true,
}));

// SPA fallback - toutes les routes vers index.html
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📁 Servant les fichiers depuis: ${distPath}`);
});

