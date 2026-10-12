/* Saca el archivo del registro de empresas (<codigo>.json) de un
   fleet-nuevo.html ya configurado para una empresa: su bloque FC_EMPRESA y
   sus logotipos. Es lo que hay que subir a wolftechsoluciones.com/app/empresas/
   para que esa empresa entre en la app de iPhone/Android con su código.

   Uso: node herramientas/empresa-json.mjs <fleet-nuevo.html> <codigo> [carpeta de salida] */
import fs from 'fs';
import path from 'path';

const [,, HTML, CODIGO, SALIDA = '.'] = process.argv;
if (!HTML || !CODIGO) { console.error('Uso: node empresa-json.mjs <fleet-nuevo.html> <codigo> [carpeta]'); process.exit(1); }
const codigo = String(CODIGO).trim().toLowerCase();
if (!/^[a-z0-9][a-z0-9-]{1,29}$/.test(codigo)) { console.error('ABORTA: el código solo lleva minúsculas, números y guiones (2 a 30 caracteres)'); process.exit(1); }

const t = fs.readFileSync(HTML, 'utf8');
const i = t.indexOf('const FC_EMPRESA = {');
const j = t.indexOf('\n};', i) + 3;
if (i < 0 || j < 3) { console.error('ABORTA: no encuentro el bloque FC_EMPRESA'); process.exit(1); }
const emp = new Function(t.slice(i, j).replace('const FC_EMPRESA =', 'return '))();
if (!emp.firebase || !emp.firebase.apiKey || !emp.firebase.databaseURL) { console.error('ABORTA: el bloque firebase está vacío: este archivo no está configurado para ninguna empresa'); process.exit(1); }

// Logotipos: si el bloque no trae los suyos, se cogen las constantes del archivo
// (LOGO_WHITE = dibujo claro para fondo oscuro; LOGO_B64 = dibujo oscuro para fondo claro).
const cte = n => { const m = new RegExp(n + '\\s*=\\s*"(data:image/[a-z+]+;base64,[^"]+)"').exec(t); return m ? m[1] : null; };
const salida = {};
for (const k of Object.keys(emp)) { if (k !== 'fabricante') salida[k] = emp[k]; }
salida.logo = emp.logo || cte('LOGO_WHITE');
salida.logoOscuro = emp.logoOscuro || cte('LOGO_B64');
if (emp.fabricante && emp.fabricante.mostrar === false) salida.fabricante = { mostrar: false };

fs.mkdirSync(SALIDA, { recursive: true });
const f = path.join(SALIDA, codigo + '.json');
fs.writeFileSync(f, JSON.stringify(salida, null, 2));
console.log(`${f}: ${salida.nombre} · proyecto ${salida.firebase.projectId} · ${Math.round(fs.statSync(f).size / 1024)} KB`);
