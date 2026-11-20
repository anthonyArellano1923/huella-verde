/**
 * Post-build step for the GitHub Pages preview.
 *
 * The site hard-codes root-relative links ("/plantas/", "/carrito/"), which
 * is correct on its own domain but breaks under GitHub Pages, where the site
 * lives in a sub-path ("/huella-verde/"). Astro's `base` option only prefixes
 * the assets it generates, so this script prefixes every remaining
 * root-relative URL in the built HTML and JS. It also writes a robots.txt
 * that keeps the preview (with sample data) out of search engines.
 *
 * Usage: node scripts/pages-base.mjs <dist-dir> <base>
 *   e.g. node scripts/pages-base.mjs dist /huella-verde
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const [dist = 'dist', base = '/huella-verde'] = process.argv.slice(2);

/** Top-level routes and folders the site links to from code. */
const RUTAS = [
  'plantas', 'accesorios', 'servicios', 'reservar', 'carrito', 'contacto',
  'terminos', 'pago', 'api', 'ropita', 'dev', 'favicon', 'og-image', '_astro', 'sitemap',
];
const rutas = RUTAS.join('|');

/**
 * Walks a directory recursively.
 *
 * @param dir - Directory to walk.
 * @returns Absolute paths of every file below it.
 */
async function archivos(dir) {
  const salida = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...(await archivos(ruta)));
    else salida.push(ruta);
  }
  return salida;
}

/**
 * Prefixes root-relative URLs with the base path, skipping ones that
 * already carry it and protocol-relative URLs ("//cdn...").
 *
 * @param texto - File contents.
 * @param tipo - File extension (".html" or ".js").
 * @returns The rewritten contents.
 */
function reescribir(texto, tipo) {
  const yaTiene = base.slice(1); // "huella-verde"
  if (tipo === '.html') {
    // Attributes: href="/x", src="/x", action="/x", content="/x" and the root link href="/".
    texto = texto.replace(
      new RegExp(`((?:href|src|action|content|component-url|renderer-url)=["'])/(?!/|${yaTiene}/)`, 'g'),
      `$1${base}/`,
    );
  }
  // String literals in HTML inline scripts and JS bundles: "/carrito/", '/api/pago/estado', `/plantas/${x}`.
  texto = texto.replace(new RegExp(`(["'\`])/(${rutas})(?=[/"'\`?#.])`, 'g'), `$1${base}/$2`);
  // Bare home link in JS ("/" alone as an href value).
  texto = texto.replace(/(href:\s*["'])\/(["'])/g, `$1${base}/$2`);
  return texto;
}

let cambiados = 0;
for (const archivo of await archivos(dist)) {
  const tipo = extname(archivo);
  if (tipo !== '.html' && tipo !== '.js') continue;
  const original = await readFile(archivo, 'utf8');
  const nuevo = reescribir(original, tipo);
  if (nuevo !== original) {
    await writeFile(archivo, nuevo);
    cambiados++;
  }
}

// The preview shows sample products and prices: keep it out of search results.
await writeFile(join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

console.log(`pages-base: ${cambiados} archivos reescritos con base ${base}`);
