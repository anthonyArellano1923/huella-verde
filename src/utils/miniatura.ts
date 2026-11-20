/**
 * Thumbnail URL stored with each cart item, so the cart drawer can show the
 * product without knowing the catalog.
 */
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { esIlustracionConocida } from '../components/ilustraciones/ids';
import { conBase } from './ruta';

/**
 * Builds the thumbnail of a product: an optimized 160 px photo when it has
 * one, otherwise its code-drawn illustration file (/miniaturas/<id>.svg).
 *
 * @param foto - Product photo, if any.
 * @param ilustracion - Illustration id from the frontmatter.
 * @returns A URL, already prefixed with the site base.
 */
export async function miniaturaProducto(foto: ImageMetadata | undefined, ilustracion: string): Promise<string> {
  if (foto) return (await getImage({ src: foto, width: 160, height: 160 })).src;
  const id = esIlustracionConocida(ilustracion) ? ilustracion : 'generica';
  return conBase(`/miniaturas/${id}.svg`);
}
