// Pruebas del registro de facturación con los ejemplos oficiales de la AEAT.
//   node herramientas/prueba-verifactu.mjs
import { createRequire } from 'module';
import crypto from 'crypto';
const require = createRequire(import.meta.url);
const VF = require('./verifactu.js');

let fallos = 0;
const igual = (a, b, msg) => {
  if (a !== b) { fallos++; console.error('✗', msg, '\n   esperado', b, '\n   obtenido', a); }
  else console.log('✓', msg);
};

// Ejemplos de las especificaciones de huella de la AEAT (registro de alta).
const r1 = {
  IDEmisorFactura: '89890001K', NumSerieFactura: '12345678/G33', FechaExpedicionFactura: '01-01-2024',
  TipoFactura: 'F1', CuotaTotal: '12.35', ImporteTotal: '123.45', Huella: '',
  FechaHoraHusoGenRegistro: '2024-01-01T19:20:30+01:00',
};
igual(VF.huellaAlta(r1), '3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60', 'AEAT alta 1 (primer registro)');
const r2 = { ...r1, NumSerieFactura: '12345679/G34', Huella: '3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60', FechaHoraHusoGenRegistro: '2024-01-01T19:20:35+01:00' };
igual(VF.huellaAlta(r2), 'F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97', 'AEAT alta 2 (encadenado)');

// La SHA-256 propia frente a la de Node, con textos de todos los tamaños y con tildes.
for (const n of [0, 1, 55, 56, 63, 64, 65, 119, 120, 1000]) {
  const s = 'ñá€'.repeat(n % 7) + 'x'.repeat(n);
  igual(VF.sha256Hex(s), crypto.createHash('sha256').update(s, 'utf8').digest('hex').toUpperCase(), `SHA-256 de ${n} caracteres`);
}

igual(VF.importe(123.4), '123.40', 'importe con dos decimales');
igual(VF.importe(0.1 + 0.2), '0.30', 'importe redondeado');
igual(VF.importe(-12.355), '-12.35', 'importe negativo (rectificativa)');
igual(VF.fechaAEAT('2026-10-12'), '12-10-2026', 'fecha de expedición');
igual(VF.fechaHoraHuso(new Date('2026-10-12T07:31:05Z')), '2026-10-12T09:31:05+02:00', 'huso de verano');
igual(VF.fechaHoraHuso(new Date('2026-01-15T18:20:30Z')), '2026-01-15T19:20:30+01:00', 'huso de invierno');

// Cadena: se detecta un importe cambiado a posteriori.
const a = { TipoRegistro: 'alta', ...r1 }; a.HuellaRegistro = VF.huellaAlta(a);
const b = { TipoRegistro: 'alta', ...r1, NumSerieFactura: 'F2', Huella: a.HuellaRegistro }; b.HuellaRegistro = VF.huellaAlta(b);
const c = { TipoRegistro: 'anulacion', IDEmisorFacturaAnulada: '89890001K', NumSerieFacturaAnulada: 'F2', FechaExpedicionFacturaAnulada: '01-01-2024', Huella: b.HuellaRegistro, FechaHoraHusoGenRegistro: '2024-01-02T10:00:00+01:00' };
c.HuellaRegistro = VF.huellaAnulacion(c);
igual(VF.verificarCadena([a, b, c]).length, 0, 'cadena alta-alta-anulación válida');
igual(VF.verificarCadena([a, { ...b, ImporteTotal: '1.00' }, c]).length > 0, true, 'cadena con importe alterado: detectada');

igual(VF.nifValido('12345678Z'), true, 'DNI válido');
igual(VF.nifValido('12345678A'), false, 'DNI con letra mala');
igual(VF.nifValido('X1234567L'), true, 'NIE válido');
igual(VF.nifValido('B64457708'), true, 'CIF de sociedad válido');

igual(VF.urlQR({ nif: '89890001K', numSerie: '12345678&G33', fecha: '01-01-2024', importeTotal: '241.4', pruebas: true }),
  'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=12345678%26G33&fecha=01-01-2024&importe=241.4', 'URL del QR (entorno de pruebas)');

if (fallos) { console.error(`\n${fallos} fallo(s)`); process.exit(1); }
console.log('\nTodo correcto');
