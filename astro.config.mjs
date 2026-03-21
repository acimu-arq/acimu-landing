import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://acimu.studio',
  output: 'server',
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

  adapter: cloudflare(),
});
