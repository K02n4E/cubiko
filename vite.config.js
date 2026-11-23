import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base './' makes the build work on any GitHub Pages path (user site or project site)
// without knowing the repo name. Routing uses the URL hash, so no 404 fallback is needed.
export default defineConfig({
  base: '/cubiko/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'], navigateFallback: 'index.html' },
      manifest: {
        name: 'Cubiko – 3x3 Speedcubing Practice',
        short_name: 'Cubiko',
        description: 'Speedcubing timer, bot races and solve statistics. Works offline.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0B1120',
        theme_color: '#0B1120',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
});
