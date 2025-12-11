import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  server: {
    allowedHosts: ['cool-nicely-oriole.ngrok-free.app'],
  },
  vite: {
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
});
