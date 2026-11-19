import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { assistantPlugin } from './assistantPlugin';

const offlineAssets: Plugin = {
  name: 'aura-offline-assets',
  apply: 'build',
  enforce: 'post',
  generateBundle(_options, bundle) {
    const assets = Object.keys(bundle).filter(name => /\.(?:css|js|woff2)$/.test(name)).sort();
    assets.push('index.html', 'manifest.webmanifest', 'favicon.svg', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
      'icons/icon-maskable-192.png', 'icons/icon-maskable-512.png', 'wellness-hero.jpg', 'wellness-pillars.jpg');
    const revision = assets.join('|').split('').reduce((hash, character) => Math.imul(31, hash) + character.charCodeAt(0) | 0, 0);
    this.emitFile({ type: 'asset', fileName: 'offline-assets.js', source: `self.AURA_OFFLINE = ${JSON.stringify({ revision, assets })};` });
  },
};

export default defineConfig({
  plugins: [react(), tailwind(), assistantPlugin(), offlineAssets],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
          'vendor-store': ['zustand'],
        },
      },
    },
  },
});
