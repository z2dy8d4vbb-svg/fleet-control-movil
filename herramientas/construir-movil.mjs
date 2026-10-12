/* ═══════════════════════════════════════════════════════════════════
   Construye la app de las tiendas (iPhone y Android) a partir del archivo
   maestro fleet-nuevo.html.

   Salidas:
     fleet-control-movil/www/index.html   la app con la configuración de
                                          empresa VACÍA: al abrirse pide el
                                          código de empresa y la descarga.
     fleet-control-movil/www/lib/*.js     el puente de Capacitor y sus
                                          plugins, copiados de node_modules
                                          (la app no usa empaquetador).
     subir-a-wolftech/app/empresas/       el registro de empresas que va en
                                          wolftechsoluciones.com: demo.json,
                                          plantilla.json y el .htaccess.

   Nada de Besbet puede viajar en la app de las tiendas: ni su proyecto de
   Firebase, ni su CIF, ni sus logos, ni las fotos de sus furgonetas. Al
   final se comprueba y, si queda algo, se aborta.
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'fs';
import path from 'path';

// Uso: node herramientas/construir-movil.mjs <fleet-nuevo.html> <demo/index.html> [carpeta del registro]
// Se ejecuta desde la raíz del proyecto (donde está package.json).
const MAESTRO  = process.argv[2] || '/mnt/user-data/outputs/fleet-nuevo.html';
const DEMO     = process.argv[3] || '/mnt/user-data/outputs/demo/index.html';
const RAIZ     = process.cwd();
const WWW      = RAIZ + '/www';
const REGISTRO = process.argv[4] || (RAIZ + '/../subir-a-wolftech/app/empresas');
const IMG      = RAIZ + '/herramientas/logos/';

let t = fs.readFileSync(MAESTRO, 'utf8');
const n0 = t.length;
if (!t.includes('fcCargaEmpresa')) { console.error('ABORTA: el maestro no lleva el modo código de empresa (node banco/movil.mjs)'); process.exit(1); }

/* ── 1 · El bloque de empresa, vacío ────────────────────────────────── */
const i = t.indexOf('const FC_EMPRESA = {');
const j = t.indexOf('\n};', i) + 3;
if (i < 0 || j < 3) { console.error('ABORTA: no encuentro el bloque de empresa'); process.exit(1); }
const original = t.slice(i, j);
let bloque = original;

const VACIOS = {
  nombre: "'Fleet Control'", lema: "''", nombreCorto: "'Fleet Control'", iniciales: "'FC'",
  color: "'#22c8e6'", logo: 'null', logoOscuro: 'null',
  razonSocial: "''", cif: "''", calle: "''", direccion: "''", provincia: "''",
  telefono: "''", email: "''", web: "''", webCorta: "''", appUrl: "''",
  authDominio: "''", instagram: "''", instagramUrl: "''"
};
let sustituidos = 0;
for (const [k, v] of Object.entries(VACIOS)) {
  const re = new RegExp('^(\\s{2}' + k + ':\\s*)(?:\'[^\']*\'|"[^"]*"|null)', 'm');
  if (!re.test(bloque)) { console.error('ABORTA: no encuentro el campo ' + k); process.exit(1); }
  bloque = bloque.replace(re, '$1' + v); sustituidos++;
}
for (const k of ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'databaseURL']) {
  const re = new RegExp('^(\\s{4}' + k + ':\\s*)"[^"]*"', 'm');
  if (!re.test(bloque)) { console.error('ABORTA: no encuentro firebase.' + k); process.exit(1); }
  bloque = bloque.replace(re, '$1""'); sustituidos++;
}
bloque = bloque.replace(
  '  // ── Firebase: un proyecto por empresa ───────────────────────────────',
  '  // ── Firebase: VACÍO a propósito. La app de las tiendas lo rellena con\n' +
  '  //    el código de empresa (ver fcCargaEmpresa, justo debajo). ─────────');
bloque = bloque.replace(
  "  // logotipo; para devolverle a Besbet su dorado basta con '#c99a3a'.",
  '  // logotipo; cada empresa trae el suyo en su configuración.');
// Mismos campos que el original, ni uno más ni uno menos.
const campos = s => [...s.matchAll(/^\s{2}([a-zA-Z]+):/gm)].map(m => m[1]);
const a = campos(original), b = campos(bloque);
if (a.join() !== b.join()) { console.error('ABORTA: los campos del bloque han cambiado: ' + a.join() + ' / ' + b.join()); process.exit(1); }
t = t.slice(0, i) + bloque + t.slice(j);
console.log('bloque de empresa : vacío (' + sustituidos + ' campos), ' + a.length + ' campos iguales que el maestro');

/* ── 2 · Logos por defecto: los de Fleet Control ────────────────────── */
const png = f => 'data:image/png;base64,' + fs.readFileSync(IMG + f).toString('base64');
const dibujoBlanco = png('fc-logo-claro.png');   // para fondo oscuro
const dibujoOscuro = png('fc-logo-oscuro.png');  // para fondo claro
let logos = 0;
for (const [nombre, valor] of [['LOGO_B64', dibujoOscuro], ['LOGO_WHITE', dibujoBlanco], ['LOGO_BLACK', dibujoOscuro]]) {
  const re = new RegExp(nombre + '\\s*=\\s*"data:image/[a-z+]+;base64,[^"]*"');
  if (!re.test(t)) { console.error('ABORTA: no encuentro ' + nombre); process.exit(1); }
  t = t.replace(re, nombre + ' = "' + valor + '"'); logos++;
}

/* ── 3 · Fotos de vehículos: dibujos neutros ────────────────────────── */
const coche = (largo, alto, etiqueta) => {
  const B = 258, x1 = 400 - largo / 2, x2 = 400 + largo / 2, techo = B - alto, morro = B - alto * 0.52;
  const quiebro = x1 + alto * 0.42, r = 33, ejeD = x1 + largo * 0.21, ejeT = x2 - largo * 0.19;
  const carroceria = [`M ${x1} ${B}`, `L ${x1} ${morro}`, `L ${quiebro} ${techo}`, `L ${x2 - 26} ${techo}`,
    `Q ${x2} ${techo} ${x2} ${techo + 26}`, `L ${x2} ${B}`, 'Z'].join(' ');
  const vTras = `M ${quiebro + 18} ${techo + 20} H ${x1 + largo * 0.52} V ${techo + alto * 0.36} H ${quiebro + 18} Z`;
  const vLado = `M ${x1 + largo * 0.56} ${techo + 20} H ${x2 - 34} V ${techo + alto * 0.36} H ${x1 + largo * 0.56} Z`;
  return 'data:image/svg+xml;base64,' + Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
     <defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#141c26"/><stop offset="1" stop-color="#0a1018"/></linearGradient></defs>
     <rect width="800" height="400" fill="url(#f)"/>
     <path d="M 90 ${B} H 710" stroke="#1f2b38" stroke-width="3"/>
     <g fill="none" stroke="#22c8e6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
       <path d="${carroceria}"/><path d="${vTras}" stroke-width="3.5" opacity=".75"/><path d="${vLado}" stroke-width="3.5" opacity=".75"/>
     </g>
     <g fill="#0a1018" stroke="#22c8e6" stroke-width="5"><circle cx="${ejeD}" cy="${B}" r="${r}"/><circle cx="${ejeT}" cy="${B}" r="${r}"/></g>
     <text x="400" y="335" text-anchor="middle" fill="#6c8299" font-family="Barlow Semi Condensed, Arial Narrow, sans-serif" font-size="26" font-weight="600" letter-spacing="7">${etiqueta}</text>
   </svg>`).toString('base64');
};
let fotos = 0;
for (const [nombre, svg] of [['VEH_IMG_VCLASS', coche(380, 150, 'MONOVOLUMEN')], ['VEH_IMG_VITO', coche(410, 165, 'FURGONETA')], ['VEH_IMG_SPRINTER', coche(470, 195, 'MINIBÚS')]]) {
  const re = new RegExp(nombre + '\\s*=\\s*"data:image/jpeg;base64,[^"]*"');
  if (!re.test(t)) { console.error('ABORTA: no encuentro ' + nombre); process.exit(1); }
  t = t.replace(re, nombre + ' = "' + svg + '"'); fotos++;
}

/* ── 5 · Nada de Besbet ─────────────────────────────────────────────── */
const restos = [
  ['besbet-fleet', /besbet-fleet/gi], ['B72431398', /B72431398/g], ['Canadella', /Canadella/gi],
  ['besbetibiza', /besbetibiza/gi], ['622 07 01 43', /622\s?07\s?01\s?43/g], ['Besbet', /besbet/gi],
  ['matrícula real', /9049\s?KHM|6577\s?MPP|0447\s?NNK/gi], ['foto real', /VEH_IMG_[A-Z]+\s*=\s*"data:image\/jpeg/g],
  ['clave de Firebase', /AIzaSy[0-9A-Za-z_-]{20,}/g]
];
let malo = 0;
for (const [et, re] of restos) { const n = (t.match(re) || []).length; if (n) { console.error('  ✗ quedan ' + n + ' restos de ' + et); malo += n; } }
if (malo) { console.error('ABORTA: la app de las tiendas no puede llevar nada de Besbet'); process.exit(1); }

/* ── 4 · El puente de Capacitor y sus plugins, sin empaquetador ──────── */
/* Con FC_WEB_SALIDA=<archivo> se genera la PLANTILLA WEB para un cliente
   nuevo: el mismo archivo neutro, sin el puente de Capacitor. El instalador
   rellena FC_EMPRESA y lo sube como index.html. */
const SALIDA_WEB = process.env.FC_WEB_SALIDA || '';
if (SALIDA_WEB) {
  fs.writeFileSync(SALIDA_WEB, t);
  console.log('plantilla web     : ' + SALIDA_WEB + ' (' + t.length + ' car., sin restos de Besbet, sin puente nativo)');
  process.exit(0);
}
fs.mkdirSync(WWW + '/lib', { recursive: true });
const NM = RAIZ + '/node_modules/@capacitor/';
const libs = [
  ['core/dist/capacitor.js',           'capacitor.js'],
  ['synapse/dist/synapse.js',          'synapse.js'],
  ['filesystem/dist/plugin.js',        'filesystem.js'],
  ['share/dist/plugin.js',             'share.js'],
  ['app/dist/plugin.js',               'app.js'],
  ['splash-screen/dist/plugin.js',     'splash-screen.js'],
  ['local-notifications/dist/plugin.js', 'local-notifications.js'],
  ['status-bar/dist/plugin.js',        'status-bar.js']
];
for (const [de, a] of libs) fs.copyFileSync(NM + de, WWW + '/lib/' + a);
const etiquetas = `
<!-- El puente nativo de Capacitor. En la web estos archivos no hacen nada
     visible; dentro de la app de iPhone/Android dan acceso a compartir
     archivos, al botón atrás, a la pantalla de arranque y a la barra de
     estado. Van copiados de node_modules por construir-movil.mjs. -->
<script src="lib/capacitor.js"></script>
<script src="lib/synapse.js"></script>
<script>var synapse = window.outsystemsSynapse || {};</script>
<script src="lib/filesystem.js"></script>
<script src="lib/share.js"></script>
<script src="lib/app.js"></script>
<script src="lib/splash-screen.js"></script>
<script src="lib/local-notifications.js"></script>
<script src="lib/status-bar.js"></script>
</head>`;
if ((t.match(/<\/head>/g) || []).length !== 1) { console.error('ABORTA: </head>'); process.exit(1); }
t = t.replace('</head>', etiquetas);

fs.writeFileSync(WWW + '/index.html', t);
console.log('logos por defecto : Fleet Control (' + logos + ' de 3)');
console.log('fotos de vehículos: dibujos neutros (' + fotos + ' de 3)');
console.log('puente Capacitor  : ' + libs.length + ' archivos en www/lib');
console.log('www/index.html    : ' + n0 + ' -> ' + t.length + ' bytes, sin restos de Besbet');

/* ── 6 · El registro de empresas para wolftechsoluciones.com ─────────── */
fs.mkdirSync(REGISTRO, { recursive: true });
const demoHtml = fs.readFileSync(DEMO, 'utf8');
const di = demoHtml.indexOf('const FC_EMPRESA = {');
const dj = demoHtml.indexOf('\n};', di) + 3;
const demoObj = new Function(demoHtml.slice(di, dj).replace('const FC_EMPRESA =', 'return ') )();
const demoLogoBlanco = png('logo-claro.png');   // el de Mediterráneo, dibujo blanco
const demoLogoOscuro = png('logo-oscuro.png');
const demoJson = {};
for (const k of a) {
  if (k === 'fabricante') continue;                 // el crédito de WolfTech va por defecto en la app
  demoJson[k] = demoObj[k];
}
demoJson.logo = demoLogoBlanco;
demoJson.logoOscuro = demoLogoOscuro;
if (!demoJson.firebase || !demoJson.firebase.apiKey || !/fleet-control-f5c1e/.test(demoJson.firebase.databaseURL)) { console.error('ABORTA: la demo no apunta a fleet-control-f5c1e'); process.exit(1); }
fs.writeFileSync(REGISTRO + '/demo.json', JSON.stringify(demoJson, null, 2));

const plantilla = {};
for (const k of a) {
  if (k === 'fabricante') continue;
  if (k === 'firebase') { plantilla.firebase = { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '', databaseURL: '' }; continue; }
  plantilla[k] = (k === 'logo' || k === 'logoOscuro') ? null : (k === 'color' ? '#22c8e6' : '');
}
plantilla.nombre = 'Nombre de la empresa'; plantilla.nombreCorto = 'Empresa'; plantilla.iniciales = 'NE';
fs.writeFileSync(REGISTRO + '/plantilla.json', JSON.stringify(plantilla, null, 2));

fs.writeFileSync(REGISTRO + '/.htaccess',
`# El registro de empresas lo lee la app de iPhone/Android desde otro origen,
# así que el servidor tiene que permitirlo (CORS). Sin esto la app dice que
# no puede contactar con el registro.
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Cache-Control "no-cache, must-revalidate"
</IfModule>
AddType application/json .json
# Que no se pueda listar la carpeta ni leer la plantilla desde fuera.
Options -Indexes
<Files "plantilla.json">
  Require all denied
</Files>
`);
console.log('registro          : ' + REGISTRO + ' (demo.json ' + Math.round(fs.statSync(REGISTRO + '/demo.json').size / 1024) + ' KB, plantilla.json, .htaccess)');
