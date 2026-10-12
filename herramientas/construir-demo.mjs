/* ═══════════════════════════════════════════════════════════════════
   Construye la DEMO web (wolftechsoluciones.com/demo/) a partir de la app
   de este repositorio.

   Desde el 12 de octubre de 2026 el código de Fleet Control vive aquí,
   en www/index.html. La demo es ese mismo archivo con:
     - la configuración de la empresa de muestra (herramientas/demo/empresa.json),
     - sus logos e imágenes (herramientas/demo/imagenes.json),
     - sin el puente de Capacitor (en la web no hace falta).

   Uso, desde la raíz del repositorio:
     node herramientas/construir-demo.mjs            → salida/demo/index.html
   Luego se sube a Hostinger, carpeta public_html/demo/.
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();
const SALIDA = path.join(RAIZ, 'salida', 'demo');
const cfg = JSON.parse(fs.readFileSync(path.join(RAIZ, 'herramientas/demo/empresa.json'), 'utf8'));
const img = JSON.parse(fs.readFileSync(path.join(RAIZ, 'herramientas/demo/imagenes.json'), 'utf8'));
let t = fs.readFileSync(path.join(RAIZ, 'www/index.html'), 'utf8');

const aborta = (m) => { console.error('ABORTA: ' + m); process.exit(1); };

// 1 · Fuera el puente nativo.
const ini = t.indexOf('<!-- El puente nativo de Capacitor.');
const fin = t.indexOf('<script src="lib/status-bar.js"></script>');
if (ini < 0 || fin < 0) aborta('no encuentro el bloque de Capacitor');
t = t.slice(0, ini) + t.slice(fin + '<script src="lib/status-bar.js"></script>'.length);

// 2 · Firebase de la demo.
for (const [k, v] of Object.entries(cfg.firebase)) {
  const re = new RegExp('^(\\s{4}' + k + ':\\s*)"[^"]*"', 'm');
  if (!re.test(t)) aborta('no encuentro firebase.' + k);
  t = t.replace(re, '$1' + JSON.stringify(v));
}

// 3 · Identidad y datos fiscales de muestra.
for (const [k, v] of Object.entries(cfg)) {
  if (k === 'firebase') continue;
  const re = new RegExp("^(\\s{2}" + k + ":\\s*)(?:'[^']*'|\"[^\"]*\"|null)", 'm');
  if (!re.test(t)) aborta('no encuentro el campo ' + k);
  t = t.replace(re, '$1' + "'" + String(v).replace(/'/g, "\\'") + "'");
}

// 4 · Logos e imágenes de la demo.
for (const [k, v] of Object.entries(img)) {
  const re = new RegExp('^const ' + k + ' = "[^"]*";', 'm');
  if (!re.test(t)) aborta('no encuentro ' + k);
  t = t.replace(re, () => `const ${k} = "${v}";`);
}

// 5 · Comprobaciones.
if (t.includes('lib/capacitor.js')) aborta('se ha quedado el puente nativo');
if (!t.includes(cfg.firebase.projectId)) aborta('no está el Firebase de la demo');
if (!t.includes('FCVF:INICIO')) aborta('falta el módulo de facturación (verifactu.js)');
const vf = fs.readFileSync(path.join(RAIZ, 'herramientas/verifactu.js'), 'utf8');
if (!t.includes(vf)) aborta('la copia de verifactu.js dentro de la app no es la del repositorio');
const qrg = fs.readFileSync(path.join(RAIZ, 'herramientas/qrcode.min.js'), 'utf8').trimEnd();
if (!t.includes(qrg)) aborta('la copia de qrcode.min.js dentro de la app no es la del repositorio');

fs.mkdirSync(SALIDA, { recursive: true });
fs.writeFileSync(path.join(SALIDA, 'index.html'), t);
console.log('✓ Demo:', path.relative(RAIZ, path.join(SALIDA, 'index.html')), Math.round(t.length / 1024) + ' KB');
