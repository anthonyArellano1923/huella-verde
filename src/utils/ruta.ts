/**
 * Current-path helper that ignores Astro's `base`.
 *
 * On the real domain `base` is "/", so nothing changes. In the GitHub Pages
 * preview the site lives under "/huella-verde/", and comparisons such as
 * "is this a shop page?" or canonical URLs must use the path without it.
 *
 * @param pathname - `Astro.url.pathname`, e.g. "/huella-verde/plantas/".
 * @returns The path relative to the site root, e.g. "/plantas/".
 */
export function rutaSinBase(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (base && pathname.startsWith(base)) {
    const resto = pathname.slice(base.length);
    return resto.startsWith('/') ? resto : `/${resto}`;
  }
  return pathname;
}

/**
 * Prefixes a root-relative path with Astro's `base`, for URLs built at
 * runtime in the browser (e.g. from cart items), which the GitHub Pages
 * post-build step cannot rewrite.
 *
 * @param ruta - Path from the site root, e.g. "/plantas/cinta/".
 * @returns "/plantas/cinta/" on the real domain, "/huella-verde/plantas/cinta/" in the preview.
 */
export function conBase(ruta: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${ruta}`;
}
