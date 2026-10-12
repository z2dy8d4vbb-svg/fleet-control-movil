/* ═══════════════════════════════════════════════════════════════════
   Fleet Control · registro de facturación (Reglamento VERI*FACTU)
   RD 1007/2023 y Orden HAC/1177/2024.

   Este archivo es la ÚNICA copia de la lógica: construir-movil.mjs y
   construir-demo.mjs lo meten tal cual en la app. Si lo cambias, pasa
   antes las pruebas:  node herramientas/prueba-verifactu.mjs

   Qué hace:
   - Huella SHA-256 de cada registro de alta y de anulación, encadenada
     con la del registro anterior, con el formato exacto de la AEAT
     (campo=valor unidos por &, UTF-8, hexadecimal en MAYÚSCULAS).
   - Fecha y hora del registro con el huso de España (Europe/Madrid).
   - Importes siempre con punto y dos decimales.
   - URL del QR tributario (sin uso todavía: ver FCF_VERIFACTU_ACTIVO).

   La SHA-256 es síncrona a propósito: se calcula dentro de la
   transacción de Firebase que reserva el número de factura, y esa
   función no puede esperar a crypto.subtle.
   ═══════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  function utf8(s) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
    return Uint8Array.from(Buffer.from(s, 'utf8'));
  }

  /** SHA-256 de un texto, en hexadecimal MAYÚSCULAS. */
  function sha256Hex(texto) {
    const m = utf8(texto);
    const l = m.length;
    const bloques = ((l + 9 + 63) >> 6);
    const w8 = new Uint8Array(bloques * 64);
    w8.set(m);
    w8[l] = 0x80;
    const bits = l * 8;
    const dv = new DataView(w8.buffer);
    dv.setUint32(w8.length - 8, Math.floor(bits / 0x100000000));
    dv.setUint32(w8.length - 4, bits >>> 0);
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const W = new Uint32Array(64);
    for (let b = 0; b < bloques; b++) {
      for (let i = 0; i < 16; i++) W[i] = dv.getUint32(b * 64 + i * 4);
      for (let i = 16; i < 64; i++) {
        const x = W[i - 15], y = W[i - 2];
        const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
      }
      let a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const maj = (a & bb) ^ (a & c) ^ (bb & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + bb) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    let out = '';
    for (let i = 0; i < 8; i++) out += H[i].toString(16).padStart(8, '0');
    return out.toUpperCase();
  }

  /** 12.3 → "12.30". Redondeo comercial a céntimos. */
  function importe(n) {
    const v = Math.round((Number(n) || 0) * 100) / 100;
    return (Object.is(v, -0) ? 0 : v).toFixed(2);
  }

  /** "2026-10-12" → "12-10-2026" (formato de la AEAT). */
  function fechaAEAT(iso) {
    const [y, m, d] = String(iso).slice(0, 10).split('-');
    return d + '-' + m + '-' + y;
  }

  /** Fecha y hora de generación con el huso de España: 2026-10-12T09:31:05+02:00 */
  function fechaHoraHuso(fecha) {
    const f = fecha || new Date();
    const partes = {};
    for (const p of new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(f)) partes[p.type] = p.value;
    const local = Date.UTC(+partes.year, +partes.month - 1, +partes.day, +partes.hour, +partes.minute, +partes.second);
    const min = Math.round((local - Math.floor(f.getTime() / 1000) * 1000) / 60000);
    const sg = min >= 0 ? '+' : '-';
    const hh = String(Math.floor(Math.abs(min) / 60)).padStart(2, '0');
    const mm = String(Math.abs(min) % 60).padStart(2, '0');
    return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}:${partes.second}${sg}${hh}:${mm}`;
  }

  const t = (v) => String(v == null ? '' : v).trim();

  /** Texto exacto que se firma en un registro de ALTA. */
  function cadenaAlta(r) {
    return 'IDEmisorFactura=' + t(r.IDEmisorFactura) +
      '&NumSerieFactura=' + t(r.NumSerieFactura) +
      '&FechaExpedicionFactura=' + t(r.FechaExpedicionFactura) +
      '&TipoFactura=' + t(r.TipoFactura) +
      '&CuotaTotal=' + t(r.CuotaTotal) +
      '&ImporteTotal=' + t(r.ImporteTotal) +
      '&Huella=' + t(r.Huella) +
      '&FechaHoraHusoGenRegistro=' + t(r.FechaHoraHusoGenRegistro);
  }

  /** Texto exacto que se firma en un registro de ANULACIÓN. */
  function cadenaAnulacion(r) {
    return 'IDEmisorFacturaAnulada=' + t(r.IDEmisorFacturaAnulada) +
      '&NumSerieFacturaAnulada=' + t(r.NumSerieFacturaAnulada) +
      '&FechaExpedicionFacturaAnulada=' + t(r.FechaExpedicionFacturaAnulada) +
      '&Huella=' + t(r.Huella) +
      '&FechaHoraHusoGenRegistro=' + t(r.FechaHoraHusoGenRegistro);
  }

  const huellaAlta = (r) => sha256Hex(cadenaAlta(r));
  const huellaAnulacion = (r) => sha256Hex(cadenaAnulacion(r));

  /** Comprueba una cadena de registros, en orden. Devuelve [] si está bien. */
  function verificarCadena(registros) {
    const errores = [];
    let anterior = '';
    registros.forEach((r, i) => {
      if (t(r.Huella) !== anterior) errores.push(`Registro ${i + 1}: no enlaza con el anterior`);
      const calc = r.TipoRegistro === 'anulacion' ? huellaAnulacion(r) : huellaAlta(r);
      if (calc !== r.HuellaRegistro) errores.push(`Registro ${i + 1}: huella alterada`);
      anterior = r.HuellaRegistro;
    });
    return errores;
  }

  /** URL del QR tributario. Producción o entorno de pruebas de la AEAT. */
  function urlQR({ nif, numSerie, fecha, importeTotal, pruebas }) {
    const host = pruebas
      ? 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR'
      : 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR';
    const q = (s) => encodeURIComponent(String(s));
    return `${host}?nif=${q(nif)}&numserie=${q(numSerie)}&fecha=${q(fecha)}&importe=${q(importeTotal)}`;
  }

  /** NIF, NIE o CIF español con formato y letra/dígito de control válidos. */
  function nifValido(nif) {
    const s = String(nif || '').toUpperCase().replace(/[\s-]/g, '');
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    if (/^\d{8}[A-Z]$/.test(s)) return letras[+s.slice(0, 8) % 23] === s[8];
    if (/^[XYZ]\d{7}[A-Z]$/.test(s)) {
      const n = 'XYZ'.indexOf(s[0]) + s.slice(1, 8);
      return letras[+n % 23] === s[8];
    }
    if (/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(s)) {
      let par = 0, impar = 0;
      for (let i = 1; i <= 7; i++) {
        const d = +s[i];
        if (i % 2 === 0) par += d;
        else { const x = d * 2; impar += Math.floor(x / 10) + (x % 10); }
      }
      const dc = (10 - ((par + impar) % 10)) % 10;
      const ctl = s[8];
      if ('PQRSNW'.includes(s[0])) return ctl === 'JABCDEFGHI'[dc];
      if ('ABEH'.includes(s[0])) return ctl === String(dc);
      return ctl === String(dc) || ctl === 'JABCDEFGHI'[dc];
    }
    return false;
  }

  const api = {
    sha256Hex, importe, fechaAEAT, fechaHoraHuso, cadenaAlta, cadenaAnulacion,
    huellaAlta, huellaAnulacion, verificarCadena, urlQR, nifValido,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.FCVF = api;
})(typeof window !== 'undefined' ? window : globalThis);
