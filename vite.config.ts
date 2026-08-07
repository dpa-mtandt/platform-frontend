import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Production is fully cloud: the built app talks to the API at VITE_API_URL.
// A dev-only reverse proxy is enabled ONLY when DEV_API_PROXY is set to an API
// origin — there is no hardcoded host.
const devProxyTarget = process.env.DEV_API_PROXY;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5190,
    ...(devProxyTarget ? { proxy: { '/api': { target: devProxyTarget, changeOrigin: true } } } : {}),
  },
});
