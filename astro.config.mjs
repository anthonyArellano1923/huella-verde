// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { terminosPublicables } from './src/data/terminos.ts';

// https://astro.build/config
export default defineConfig({
  // TODO(Anthony): cambiar por el dominio real comprado en nic.cl (Fase 6).
  // `site` alimenta el sitemap y las URLs canónicas.
  site: 'https://www.huellaverde.cl',
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
  adapter: vercel(),
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
