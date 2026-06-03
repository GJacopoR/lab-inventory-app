import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
        VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Single source of truth for the manifest
      manifest: {
        name: 'Lab Inventory PWA',
        short_name: 'Inventario',
        description: 'Gestione inventario e ricette per laboratori alimentari',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#fdfdfd',
        theme_color: '#2563eb', // Tailwind blue‑600
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // generateSW defaults are fine for the MVP
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  // optional base path handling if later needed
  // base: '/',
});
