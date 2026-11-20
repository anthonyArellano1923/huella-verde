// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { terminosPublicables } from './src/data/terminos.ts';

/**
 * Static preview build for GitHub Pages (set by .github/workflows/pages.yml).
 * Pages only serves files: no adapter, no serverless routes (the workflow
 * removes them before building), and the site lives under /huella-verde/.
 * Online payments are therefore unavailable there and the UI falls back to
 * WhatsApp. The real deployment (Vercel) keeps the adapter.
 */
const esGitHubPages = process.env.GITHUB_PAGES === 'true';

// https://astro.build/config
export default defineConfig({
  // TODO(Anthony): cambiar por el dominio real comprado en nic.cl (Fase 6).
  // `site` alimenta el sitemap y las URLs canónicas.
  site: esGitHubPages ? 'https://anthonyarellano1923.github.io' : 'https://www.huellaverde.cl',
  base: esGitHubPages ? '/huella-verde' : undefined,
  trailingSlash: 'ignore',
  integrations: [
    react(),
    sitemap({
      // Fuera del sitemap:
      // - /terminos mientras `terminosPublicables()` sea false (decisiones de
      //   Martha sin confirmar en src/data/terminos.ts; la página lleva noindex).
      // - /ropita: fuera del alcance de lanzamiento (la ruta existe con noindex).
      // - /dev/: páginas internas de revisión (p. ej. /dev/ilustraciones).
      // - /carrito y /pago/: pasos de compra, sin valor en buscadores.
      filter: (pagina) => {
        const ruta = new URL(pagina).pathname;
        if (ruta.startsWith('/terminos') && !terminosPublicables()) return false;
        return !['/ropita', '/dev/', '/carrito', '/pago/'].some((r) => ruta.startsWith(r));
      },
    }),
  ],
  // Rama transbank: la web sigue siendo estática, pero el adapter permite
  // que las rutas marcadas con `prerender = false` (crear/confirmar pago)
  // corran como funciones serverless en Vercel.
  adapter: esGitHubPages ? undefined : vercel(),
  vite: {
    // En dev, Vite pre-empaqueta las dependencias por separado y puede
    // terminar con DOS copias de React (una para las islas, otra dentro de
    // @nanostores/react) → "Invalid hook call". dedupe fuerza una sola.
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@nanostores/react', '@nanostores/persistent', 'nanostores'],
    },
  },
});
