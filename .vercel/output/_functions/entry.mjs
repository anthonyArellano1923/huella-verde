import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_DQWtody8.mjs';
import { manifest } from './manifest_8kzt1fbc.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/api/pago/crear.astro.mjs');
const _page3 = () => import('./pages/api/pago/webhook.astro.mjs');
const _page4 = () => import('./pages/carrito.astro.mjs');
const _page5 = () => import('./pages/contacto.astro.mjs');
const _page6 = () => import('./pages/pago/retorno.astro.mjs');
const _page7 = () => import('./pages/reservar.astro.mjs');
const _page8 = () => import('./pages/ropita/_slug_.astro.mjs');
const _page9 = () => import('./pages/ropita.astro.mjs');
const _page10 = () => import('./pages/servicios.astro.mjs');
const _page11 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/api/pago/crear.ts", _page2],
    ["src/pages/api/pago/webhook.ts", _page3],
    ["src/pages/carrito.astro", _page4],
    ["src/pages/contacto.astro", _page5],
    ["src/pages/pago/retorno.astro", _page6],
    ["src/pages/reservar.astro", _page7],
    ["src/pages/ropita/[slug].astro", _page8],
    ["src/pages/ropita/index.astro", _page9],
    ["src/pages/servicios.astro", _page10],
    ["src/pages/index.astro", _page11]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "a37d6668-0a9c-4b1f-85cb-6cb16ba13799",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
