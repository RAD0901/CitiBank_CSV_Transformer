import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Base URL for deployment
  base: '/',
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    
    // Generate source maps for debugging
    sourcemap: true,
    
    // Optimize chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'csv-vendor': ['papaparse'],
          'ui-vendor': ['lucide-react']
        }
      }
    },
    
    // Optimize for production
    minify: 'terser'
  },
  
  // Development server
  server: {
    port: 3000,
    open: true
  },
  
  // Preview server
  preview: {
    port: 4173
  }
})
