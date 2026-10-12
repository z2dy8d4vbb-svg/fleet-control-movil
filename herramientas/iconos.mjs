/* Dibuja los recursos de la app (icono, icono adaptativo de Android y
   pantalla de arranque) con el coche del logotipo de Fleet Control, y los
   deja en fleet-control-movil/assets/ para @capacitor/assets. */
import { chromium } from 'playwright';
import fs from 'fs';

const SAL = process.cwd() + '/assets/';
fs.mkdirSync(SAL, { recursive: true });
const COCHE = fs.readFileSync(process.cwd() + '/herramientas/coche-path.txt', 'utf8').trim();
const FONDO = '#0a1018', CIAN = '#22c8e6', CIAN2 = '#0aa8e0';

// El coche mide 600×200 en su viewBox; se coloca por anchura relativa.
const coche = (ancho, cx, cy, id) => `
  <g transform="translate(${cx - ancho / 2} ${cy - ancho / 6}) scale(${ancho / 600})">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".46" stop-color="#ffffff"/>
      <stop offset=".70" stop-color="${CIAN}"/><stop offset="1" stop-color="${CIAN2}"/>
    </linearGradient></defs>
    <path fill="url(#${id})" fill-rule="evenodd" d="${COCHE}"/>
  </g>`;

const svg = (lado, cuerpo, fondo = FONDO) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">
     <rect width="${lado}" height="${lado}" fill="${fondo}"/>${cuerpo}</svg>`;

const recursos = {
  // Icono: coche grande, un poco por encima del centro, sin texto (no se lee a 60 px).
  'icon.png':            svg(1024, coche(980, 512, 500, 'a')),
  // Android adaptativo: el sistema recorta un círculo del 66 % central, así
  // que el coche va más pequeño y el fondo es otra capa de color plano.
  'icon-foreground.png': svg(1024, coche(620, 512, 505, 'b'), 'transparent').replace(`fill="transparent"`, `fill="none"`),
  'icon-background.png': svg(1024, ''),
  // Arranque: coche al 40 % y el nombre debajo. Lo mismo en claro y oscuro:
  // la app arranca en oscuro y la pantalla de carga también lo es.
  'splash.png':          svg(2732, coche(1100, 1366, 1250, 'c') +
    `<text x="1366" y="1700" text-anchor="middle" font-family="Saira, Barlow, Arial, sans-serif" font-weight="700" font-size="150" letter-spacing="34" fill="#ffffff">FLEET <tspan fill="${CIAN}">CONTROL</tspan></text>`),
};
recursos['splash-dark.png'] = recursos['splash.png'];

const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await nav.newPage();
for (const [nombre, cuerpo] of Object.entries(recursos)) {
  const lado = nombre.startsWith('splash') ? 2732 : 1024;
  await p.setViewportSize({ width: lado, height: lado });
  await p.setContent(`<!doctype html><html><head>
    <link href="https://fonts.googleapis.com/css2?family=Saira:wght@700&display=swap" rel="stylesheet">
    <style>html,body{margin:0;background:${nombre === 'icon-foreground.png' ? 'transparent' : FONDO}}svg{display:block}</style>
    </head><body>${cuerpo}</body></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  await p.screenshot({ path: SAL + nombre, omitBackground: nombre === 'icon-foreground.png', clip: { x: 0, y: 0, width: lado, height: lado } });
  console.log('✓ ' + nombre);
}
await nav.close();
