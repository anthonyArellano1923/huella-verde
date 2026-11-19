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

/* ─────────────────────────── Tienda de plantas ─────────────────────────── */

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
    /** Gancho de venta en 1-2 frases; el detalle largo va en el cuerpo del .md. */
    descripcion: z.string(),
    /** Precio en pesos chilenos, entero y sin puntos: 12990. */
    precio: z.number().int().positive(),
    /** Unidades disponibles. 0 = agotado (el producto se sigue mostrando). */
    stock: z.number().int().min(0).default(1),
    /** true = producto de ejemplo, aún no es parte del catálogo real. */
    generico: z.boolean().default(false),
    /** Foto real (en src/assets/tienda/). Si existe, reemplaza a la ilustración. */
    foto: image().optional(),
    /** Texto alternativo: describe la foto o, si no hay, la ilustración. */
    fotoAlt: z.string(),
    /** Destacados aparecen primero en el listado. */
    destacado: z.boolean().default(false),
  };
}

const plantas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/plantas' }),
  schema: ({ image }) =>
    z.object({
      ...camposProducto(image),
      ilustracion: z.enum(ILUSTRACIONES_PLANTAS),
      /** Nombre científico, sin itálicas (la página las aplica). */
      nombreCientifico: z.string(),
      /**
       * Familia botánica. Conecta la planta con las advertencias de los
       * accesorios (p. ej. Proteaceae → fertilizantes con fósforo).
       */
      familia: z.string().optional(),
      luz: z.enum(['sombra', 'media-sombra', 'sol-indirecto', 'pleno-sol']),
      riego: z.enum(['bajo', 'moderado', 'alto']),
      dificultad: z.enum(['facil', 'media', 'experta']),
      /**
       * true solo si hay evidencia confiable de que no es tóxica para perros
       * y gatos. Ante la duda: false y lenguaje de precaución en el texto.
       */
      petFriendly: z.boolean(),
      /** true = nativa de Chile. */
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
      /** true = apto para nativas chilenas en general (ver advertencias). */
      aptoNativas: z.boolean(),
      /** Avisos de compatibilidad o seguridad, una frase cada uno. */
      advertencias: z.array(z.string()).default([]),
    }),
});

export const collections = { prendas, plantas, accesorios };
