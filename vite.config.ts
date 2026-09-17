import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // The router plugin must run before the React plugin so generated
    // route chunks are transformed by it.
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      // Also split loaders: they import the query/data layer, which would
      // otherwise land in the entry chunk alongside the route definitions.
      codeSplittingOptions: {
        defaultBehavior: [
          ['loader'],
          ['component'],
          ['pendingComponent'],
          ['errorComponent'],
          ['notFoundComponent'],
        ],
      },
      quoteStyle: 'single',
      semicolons: false,
    }),
    react(),
    tailwindcss(),
  ],
  build: {
    // The React Bits route intentionally carries three.js/ogl/R3F in its own
    // lazy chunk (~1 MB); everything else stays well below this.
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // Zod is needed up front: every route's validateSearch runs in the entry.
            { name: 'zod', test: /node_modules[\\/]zod[\\/]/ },
            {
              // Keep the data layer (CSV parsing, source clients, query
              // factories) out of the chunks the landing page loads. Without
              // this, automatic chunking merges it with TanStack Query/Router.
              name: 'data-layer',
              test: /node_modules[\\/]d3-dsv[\\/]|src[\\/]lib[\\/](sources[\\/]|fetchers\.ts|query\.ts)/,
              includeDependenciesRecursively: false,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
