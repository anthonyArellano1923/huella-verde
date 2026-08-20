/**
 * Content collections — el "catálogo como archivos".
 *
 * Cada prenda es un archivo .md en src/content/prendas/. El schema (zod)
 * valida el frontmatter al compilar: si a una prenda le falta el precio o
 * la talla está mal escrita, `npm run build` falla con un error claro en
 * vez de publicar una web rota. Para agregar una prenda: duplicar un .md,
 * editar los datos y poner la foto en src/assets/prendas/.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const prendas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/prendas' }),
  schema: ({ image }) =>
    z.object({
      nombre: z.string(),
      descripcion: z.string(),
      /** Tallas de ropa canina chilenas habituales. */
      talla: z.enum(['XS', 'S', 'M', 'L', 'XL']),
      /** Precio en pesos chilenos, sin puntos: 15990. */
      precio: z.number().int().positive(),
      /** Foto principal (en src/assets/prendas/); Astro la optimiza a AVIF/WebP. */
      foto: image(),
      /** Texto alternativo de la foto — obligatorio por accesibilidad. */
      fotoAlt: z.string(),
      /**
       * Stock estimado que mantiene la dueña a mano. En la Fase 7 esto se
       * reemplaza por stock real en base de datos.
       */
      stock: z.number().int().min(0).default(1),
      temporada: z.enum(['invierno', 'verano', 'todo-el-año']).default('invierno'),
      /** Prendas destacadas aparecen primero y en la portada. */
      destacada: z.boolean().default(false),
    }),
});

export const collections = { prendas };
