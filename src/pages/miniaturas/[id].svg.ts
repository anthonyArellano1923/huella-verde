/**
 * Static SVG file per illustration id (/miniaturas/<id>.svg), built at
 * compile time from the same Astro components the catalog uses.
 *
 * The cart drawer fetches these files and inlines them, so the page's CSS
 * (.ilus classes and palette variables, light or dark) colors them exactly
 * like the product cards. One file per drawing, not per product: products
 * share illustrations.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Ilustracion from '../../components/ilustraciones/Ilustracion.astro';
import { ILUSTRACION_IDS } from '../../components/ilustraciones/ids';

export const prerender = true;

export const getStaticPaths = (() =>
  // "generica" is the fallback drawing for unknown ids.
  [...ILUSTRACION_IDS, 'generica'].map((id) => ({ params: { id } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const contenedor = await AstroContainer.create();
  const svg = await contenedor.renderToString(Ilustracion, { props: { id: params.id! } });
  return new Response(svg.trim(), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
};
