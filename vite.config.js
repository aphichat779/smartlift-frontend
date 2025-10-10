// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'icons/maskable-192.png',
        'icons/maskable-512.png'
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,avif}'],
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'SmartLift',
        short_name: 'SmartLift',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0ea5e9',
        description: 'Smart elevator monitoring & control',
        orientation: 'portrait',
        icons: [
          { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
  },
});
