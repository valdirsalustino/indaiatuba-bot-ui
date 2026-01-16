import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. Increase the warning limit slightly if the split chunks are still large
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // 2. Separate third-party libraries into a "vendor" chunk
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
