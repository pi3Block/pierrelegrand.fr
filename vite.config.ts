import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    glsl(), // Support pour les fichiers .glsl
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@api': resolve(__dirname, 'src/api'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@data': resolve(__dirname, 'src/data'),
      '@config': resolve(__dirname, 'src/config'),
      '@services': resolve(__dirname, 'src/services'),
      '@factories': resolve(__dirname, 'src/factories'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    fs: {
      strict: false,
    },
  },

  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,

    rollupOptions: {
      // Multi-page: main app + arcade standalone pour l'iframe CSS3D
      input: {
        main: resolve(__dirname, 'index.html'),
        arcade: resolve(__dirname, 'arcade.html'),
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three'],
          'vendor-r3f': ['@react-three/fiber', '@react-three/drei'],
          'vendor-rapier': ['@react-three/rapier'],
        },
      },
    },

    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr'],
})
