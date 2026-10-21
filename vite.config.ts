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
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5000000, // 5 MiB
        // Ne pas pré-cacher les gros chunks rarement utilisés (globe 3D, données cartes,
        // admin, langues non actives) : évite ~5 Mo de téléchargement à la 1re visite.
        // Ils sont mis en cache à la demande via la règle runtime "app-chunks" ci-dessous.
        globIgnores: [
          '**/vendor-three-*.js',
          '**/vendor-charts-*.js',
          '**/data-*.js',
          '**/*Management*.js',
          '**/Admin*.js',
          '**/SiteConfigPage-*.js',
          '**/QuizValidationPage-*.js',
          '**/{en,de,es,it,pt}-*.js',
        ],
        runtimeCaching: [
          {
            // 0. Chunks JS/CSS hashés non pré-cachés : immuables → CacheFirst
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\/assets\/.+-[A-Za-z0-9_-]{8}\.(?:js|css)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-chunks',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // 1. GeoJSON, TopoJSON et cartes custom / CDN (raw.githubusercontent, unpkg, etc.)
            urlPattern: /^https:\/\/(?:raw\.githubusercontent\.com|unpkg\.com)\/.*|.*\/storage\/v1\/object\/public\/custom-geojson\/.*|.*\.(?:geojson|topojson)(?:\?.*)?$/i,
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
            // ⚠️ React DOIT avoir son propre chunk : sinon Rollup l'aspire dans le
            // premier chunk manuel qui en dépend (ex. vendor-charts), ce qui forçait
            // le téléchargement de Recharts (~500 kB) sur toutes les pages.
            if (
              /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run|use-sync-external-store|react-is)[\\/]/.test(id)
            ) {
              return 'vendor-react';
            }
            // d3 est partagé entre Recharts, react-simple-maps et le globe :
            // chunk dédié pour éviter qu'un chunk n'importe l'autre.
            if (/[\\/]node_modules[\\/](d3-[^\\/]+|internmap)[\\/]/.test(id)) {
              return 'vendor-d3';
            }
            if (id.includes('three') || id.includes('globe.gl')) {
              return 'vendor-three';
            }
            // Données cartographiques séparées : chaque jeu ne charge que ce qu'il utilise
            if (id.includes('world-atlas')) return 'data-world-atlas';
            if (id.includes('us-atlas') || id.includes('/node_modules/us/')) return 'data-us';
            if (id.includes('swiss-maps')) return 'data-swiss';
            if (id.includes('react-simple-maps') || id.includes('topojson-client')) {
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
