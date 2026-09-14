import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png',
      ],
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000, // 5 MiB
        runtimeCaching: [
          {
            // 1. GeoJSON, TopoJSON et cartes custom / CDN (raw.githubusercontent, unpkg, etc.)
            urlPattern: /^https:\/\/(?:raw\.githubusercontent\.com|unpkg\.com)\/.*|.*\/storage\/v1\/object\/public\/custom-maps\/.*|.*\.(?:geojson|topojson)(?:\?.*)?$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'geojson-maps-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 2. Images, couvertures et avatars Supabase Storage
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/.*(?:\.(?:png|jpg|jpeg|svg|webp|gif))?$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-media-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 14, // 14 jours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 3. Polices Google Fonts
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 an
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'TerraCoast',
        short_name: 'TerraCoast',
        description: 'Apprenez la géographie en vous amusant avec TerraCoast!',
        theme_color: '#10b981', // Emerald-500
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('react-globe.gl')) {
              return 'vendor-three';
            }
            if (
              id.includes('react-simple-maps') ||
              id.includes('world-atlas') ||
              id.includes('topojson-client') ||
              id.includes('swiss-maps') ||
              id.includes('us-atlas') ||
              id.includes('/us/')
            ) {
              return 'vendor-maps';
            }
            if (id.includes('world-countries')) {
              return 'data-countries';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-query';
            }
          }
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
