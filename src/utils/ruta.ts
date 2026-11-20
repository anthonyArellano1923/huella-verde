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
