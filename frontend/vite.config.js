import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'SwasthAI Guardian',
        short_name: 'SwasthAI',
        description: 'AI-powered rural health guardian for villages across India. Symptom checker, Sakhi AI, ambulance access & outbreak alerts.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F8FAFC',
        theme_color: '#059669',
        lang: 'hi-IN',
        categories: ['health', 'medical', 'lifestyle'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Call Ambulance / एम्बुलेंस बुलाएं',
            short_name: '108',
            description: 'Emergency ambulance request',
            url: '/ambulance',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Sakhi AI / सखी',
            short_name: 'Sakhi',
            description: 'Women\'s health AI assistant',
            url: '/menstrual-health',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Symptom Check / बीमारी जांच',
            short_name: 'Jaanch',
            description: 'Check your symptoms with AI',
            url: '/symptoms',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    minify: 'esbuild',
    rollupOptions: {
      cache: false,
      maxParallelFileOps: 3,
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'recharts', 'framer-motion', 'leaflet'],
        }
      }
    }
  }
})
