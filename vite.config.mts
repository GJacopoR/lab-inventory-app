import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Load base path from environment (for GitHub Pages) or default to root
const getBasePath = () => {
  if (process.env.GITHUB_PAGES) {
    return '/inventory-app/';
  }
  return '/';
};

export default defineConfig({
  base: getBasePath(),
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'Lab Inventory PWA',
        short_name: 'Inventario',
        description: 'Gestione inventario e ricette per laboratori alimentari',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#fdfdfd',
        theme_color: '#2563eb',
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
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
