/**
 * Content collections — el "catálogo como archivos".
 *
 * Cada prenda es un archivo .md en src/content/prendas/. El schema (zod)
 * valida el frontmatter al compilar: si a una prenda le falta el precio o
 * la talla está mal escrita, `npm run build` falla con un error claro en
 * vez de publicar una web rota. Para agregar una prenda: duplicar un .md,
 * editar los datos y poner la foto en src/assets/prendas/.
 */
import { defineCollection, z, type SchemaContext } from 'astro:content';
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

/* ─────────────────────────── Plant shop ─────────────────────────── */

/**
 * Plant illustration ids. The real SVGs live in
 * src/components/ilustraciones/Ilustracion.astro; an enum makes a typo in a
 * product file fail the build instead of rendering a blank image.
 */
const ILUSTRACIONES_PLANTAS = [
  'suculenta',
  'cactus',
  'helecho',
  'monstera',
  'potus',
  'lavanda',
  'nativa-arbusto',
  'planta-colgante',
] as const;

/** Accessory illustration ids (same contract as the plant ones). */
const ILUSTRACIONES_ACCESORIOS = [
  'macetero-terracota',
  'macetero-ceramica',
  'macetero-colgante',
  'sustrato',
  'fertilizante-liquido',
  'abono-organico',
  'regadera',
  'pulverizador',
  'tijeras-poda',
  'kit-cuidado',
] as const;

/** Every illustration id the shop can reference, for the Ilustracion component. */
export const ILUSTRACIONES = [...ILUSTRACIONES_PLANTAS, ...ILUSTRACIONES_ACCESORIOS] as const;
export type IlustracionId = (typeof ILUSTRACIONES)[number];

/**
 * Fields shared by every shop product (plants and accessories).
 *
 * @param image - Astro's image() helper, passed in from the schema callback.
 * @returns A zod object shape to spread into each collection schema.
 */
function camposProducto(image: SchemaContext['image']) {
  return {
    nombre: z.string(),
    /** One or two selling sentences; longer copy goes in the .md body. */
    descripcion: z.string(),
    /** Price in Chilean pesos, integer without separators: 12990. */
    precio: z.number().int().positive(),
    /** Units available. 0 = sold out (the product is still listed). */
    stock: z.number().int().min(0).default(1),
    /** true = sample product, not yet part of the real catalog. */
    generico: z.boolean().default(false),
    /** Real photo (in src/assets/tienda/). When present it replaces the illustration. */
    foto: image().optional(),
    /** Alt text: describes the photo or, if there is none, the illustration. */
    fotoAlt: z.string(),
    /** Featured products are listed first. */
    destacado: z.boolean().default(false),
  };
}

const plantas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/plantas' }),
  schema: ({ image }) =>
    z.object({
      ...camposProducto(image),
      ilustracion: z.enum(ILUSTRACIONES_PLANTAS),
      /** Scientific name, plain text (pages apply the italics). */
      nombreCientifico: z.string(),
      /**
       * Botanical family. Links the plant to accessory warnings
       * (e.g. Proteaceae → avoid phosphorus fertilizers).
       */
      familia: z.string().optional(),
      luz: z.enum(['sombra', 'media-sombra', 'sol-indirecto', 'pleno-sol']),
      riego: z.enum(['bajo', 'moderado', 'alto']),
      dificultad: z.enum(['facil', 'media', 'experta']),
      /**
       * true only with reliable evidence that it is non-toxic to dogs and
       * cats. When in doubt: false, plus cautious wording in the body.
       */
      petFriendly: z.boolean(),
      /** true = native to Chile. */
      nativa: z.boolean(),
    }),
});

const accesorios = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/accesorios' }),
  schema: ({ image }) =>
    z.object({
      ...camposProducto(image),
      ilustracion: z.enum(ILUSTRACIONES_ACCESORIOS),
      categoria: z.enum(['macetero', 'sustrato', 'fertilizante', 'suplemento', 'cuidado', 'herramienta']),
      /** true = suitable for Chilean native plants in general (see warnings). */
      aptoNativas: z.boolean(),
      /** Compatibility or safety notices, one sentence each. */
      advertencias: z.array(z.string()).default([]),
    }),
});

export const collections = { prendas, plantas, accesorios };
