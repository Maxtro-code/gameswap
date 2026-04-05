import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    server: {
        port: 5173,
        // Proxy les appels API vers le backend Express
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },
    build: {
        // Le build sera copié dans backend/public pour la production
        outDir: '../backend/public',
        emptyOutDir: true
    }
})
