// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO(Anthony): cambiar por el dominio real comprado en nic.cl (Fase 6).
  // `site` alimenta el sitemap y las URLs canónicas.
  site: 'https://www.marthamella.cl',
  integrations: [react(), sitemap()],
});
