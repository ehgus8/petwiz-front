import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 반드시 포함
    port: 5173,
    allowedHosts: ['hrhub.cc', 'www.hrhub.cc'],
    proxy: {
      '/api': {
        target: 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
