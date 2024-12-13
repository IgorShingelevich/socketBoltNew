import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/startCalculation': 'http://localhost:3000',
      '/stopCalculation': 'http://localhost:3000',
      '/progress': 'http://localhost:3000'
    }
  }
});