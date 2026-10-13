# Fleet Control · app de iPhone y Android

Esta carpeta es el proyecto que se sube a GitHub y se compila en Codemagic.
Una sola app en las dos tiendas para todas las empresas: al abrirla por
primera vez pide un **código de empresa**, descarga la configuración de esa
empresa desde `wolftechsoluciones.com/app/empresas/<codigo>.json` y la
recuerda. Cada empresa sigue teniendo su propio proyecto de Firebase.

```
www/index.html        la app (la misma que la web, con la configuración vacía)
www/lib/              el puente de Capacitor y sus plugins (sin empaquetador)
android/              proyecto Android listo (permisos, firma, iconos)
ios/                  proyecto iPhone listo (permisos, iconos, iOS 15+)
assets/               icono y pantalla de arranque originales (1024 y 2732 px)
codemagic.yaml        los dos flujos de compilación
capacitor.config.ts   id de la app, colores, pantalla de arranque
```

Id de la app en las dos tiendas: `com.wolftechsoluciones.fleetcontrol`.


## 1 · Subirlo a GitHub

Repositorio nuevo y **privado** (la app lleva dentro el registro de WolfTech
y no hay motivo para publicarla).

```
cd fleet-control-movil
git init
git add .
git commit -m "Fleet Control móvil 2.0"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/fleet-control-movil.git
git push -u origin main
```

`node_modules`, los `build/` y los `Pods/` quedan fuera por el `.gitignore`.
Codemagic los regenera en cada compilación.


## 2 · Codemagic, una sola vez

1. codemagic.io → Add application → GitHub → el repositorio. Cuando pregunte
   el tipo de proyecto, elige **Ionic/Capacitor** o "codemagic.yaml": el
   archivo ya está en la raíz y es el que manda.

2. **Android** · Teams → Code signing identities → Android keystores →
   *Generate keystore* (o sube uno). Nombre de referencia exacto:
   `fleet_control_keystore`. Es el que aparece en `codemagic.yaml`.
   Guarda la contraseña y el alias en un sitio seguro: sin ese almacén no se
   puede actualizar la app en Google Play nunca más.

3. **iPhone** · hace falta el Apple Developer Program (99 €/año) y:
   - App Store Connect → Usuarios y acceso → Claves (Integraciones) → crear
     una clave API con rol *App Manager*. Descarga el `.p8` (solo se puede
     una vez) y apunta Issuer ID y Key ID.
   - Codemagic → Teams → Integrations → App Store Connect → añadir con esas
     tres cosas. Nombre exacto: `WolfTech` (está en `codemagic.yaml`).
   - App Store Connect → Apps → nueva app, bundle id
     `com.wolftechsoluciones.fleetcontrol`, nombre "Fleet Control".
   Con la integración puesta, Codemagic crea solo certificados y perfiles.

4. Start new build → elige el flujo (*Fleet Control · Android* o *Fleet
   Control · iPhone*). Android tarda unos 6-8 minutos; iPhone, 15-20.

Lo que sale:
- Android: `app-release.aab` (para Google Play) y `app-release.apk` (para
  instalar a mano en cualquier móvil Android).
- iPhone: `App.ipa`, y si la integración está bien, aparece en TestFlight
  solo. Instálalo en tu iPhone con la app TestFlight.

El número de versión sube solo en cada compilación (BUILD_NUMBER de
Codemagic). La versión visible es 2.0.N.


## 3 · Probar sin tiendas (hoy mismo)

El `app-release.apk` de Android se instala directamente: pásalo por
WhatsApp o cable, abre el archivo en el móvil y acepta "instalar de origen
desconocido". En iPhone no hay atajo: TestFlight.

Primera pantalla: código de empresa. Para la demo, `demo`. Usuario `demo`,
contraseña `demo1234`.


## 4 · Dar de alta una empresa en la app

La app busca el código en dos sitios, por orden:

1. `https://wolftechsoluciones.com/app/empresas/<codigo>.json` (Hostinger,
   carpeta `public_html/app/empresas/` con su `.htaccess`).
2. `https://fleet-control-registro-yakoibiza-7471.vercel.app/empresas/<codigo>.json`
   (copia en la cuenta de Vercel de Wolf; proyecto `fleet-control-registro`).
   Es el respaldo: se usa si el primero no responde o no está subido.

Si hay que cambiar estas direcciones, están en `www/index.html`, constante
`FC_REGISTROS`; cambiarlas obliga a
publicar una versión nueva de la app.

No hay que compilar nada para añadir una empresa. En Hostinger, carpeta
`public_html/app/empresas/`:

1. Copia `plantilla.json` como `<codigo>.json` (minúsculas, sin espacios:
   `vtcibiza.json`, `transfers-norte.json`).
2. Rellena los siete valores de `firebase` (de la consola de Firebase del
   proyecto de esa empresa) y la identidad: nombre, datos fiscales,
   `authDominio`, color. `logo` y `logoOscuro` admiten una imagen PNG en
   base64 (`data:image/png;base64,...`) o `null` para usar el de Fleet
   Control.
3. Sube el archivo. Comprueba en el navegador que
   `https://wolftechsoluciones.com/app/empresas/<codigo>.json` se abre.

La empresa recibe su código. Es lo mismo que la web de su instalación:
cualquiera que lo sepa ve la pantalla de entrada, nadie entra sin usuario y
contraseña.

Marca blanca pura: añade `"fabricante": { "mostrar": false }` al JSON y
desaparece el crédito de WolfTech de la entrada, del raíl y de Ajustes.


## 5 · Actualizar la app

Desde el 12 de octubre de 2026 **el código de Fleet Control vive aquí**, en
`www/index.html`. Ya no hay maestro `fleet-nuevo.html` fuera del repositorio:
se edita este archivo y de él salen la app de las tiendas y la demo web.

1. Cambia `www/index.html` y prueba la demo:
   `node herramientas/construir-demo.mjs` → `salida/demo/index.html`
   (le pone la empresa de muestra, sus imágenes y quita el puente nativo).
2. `node herramientas/prueba-verifactu.mjs` si has tocado la facturación.
3. `git commit` + `git push`; Start new build en Codemagic.
4. La demo web: sube `salida/demo/index.html` a Hostinger,
   `public_html/demo/`.

Dos librerías van incrustadas en `www/index.html` entre marcas y no se
editan ahí: `herramientas/verifactu.js` (FCVF) y `herramientas/qrcode.min.js`
(QRG). `construir-demo.mjs` aborta si la copia de dentro no coincide.

`herramientas/construir-movil.mjs` es la herramienta del flujo antiguo (a
partir de `fleet-nuevo.html`); solo sirve ya para volver a copiar los
plugins de `node_modules` a `www/lib/`.

Cambios de nombre, icono o permisos: `capacitor.config.ts`,
`assets/` (+ `npm run assets`), `android/app/src/main/AndroidManifest.xml`
e `ios/App/App/Info.plist`. Un plugin nuevo de Capacitor: `npm i`, copiar su
`dist/plugin.js` a `www/lib/`, añadir su `<script>` antes de `status-bar.js`
y `npx cap sync`.


## 5 bis · Facturación

Facturas con numeración correlativa por serie y año (F/R), registro
encadenado con huella SHA-256 según la especificación VERI*FACTU, factura
simplificada hasta 3.000 €, rectificativas y anulaciones. Las emitidas no se
editan ni se borran.

**Falta el envío a la AEAT** (`FCF_VERIFACTU_ACTIVO = false`): necesita un
servidor con el certificado electrónico de cada empresa. Hasta entonces el
PDF no lleva el QR tributario ni la leyenda VERI*FACTU.

Reglas de Firebase que blindan el registro (solo crear, nunca borrar):
`herramientas/reglas-facturacion.json`. Hay que pegarlas en la consola de
cada empresa; sin ellas la app funciona, pero alguien con acceso de oficina
y conocimientos podría borrar registros desde fuera de la app.


## 6 · Lo que esta versión NO hace todavía

- **Push desde servidor.** La app programa avisos en el propio móvil
  (servicio en 60 y 15 min, servicio sin chófer, caducidades) y saca como
  notificación lo que entra en la campana mientras está abierta. Lo que no
  hace: avisar de un servicio recién asignado con la app cerrada desde hace
  rato. Eso necesita un servidor central de WolfTech que mande push (una app
  de tienda solo recibe push de un proyecto de Firebase, y aquí cada empresa
  tiene el suyo).
- **Ubicación en segundo plano.** La posición del chófer se envía mientras
  la app está abierta en pantalla. Con el móvil bloqueado no.
- **Sin conexión.** La app necesita internet: la base de datos es Firebase.

Lo que sí se ha comprobado aquí: el proyecto Android compila de principio
a fin (APK y AAB), el modo de código de empresa funciona (código malo,
bueno, recordado, cambio, enlace `?empresa=`), y las descargas de PDF y
CSV usan la hoja de compartir del sistema cuando corren dentro de la app.
Lo que no se ha podido comprobar aquí: la app corriendo en un iPhone o un
Android de verdad. Lo primero que hay que hacer con el primer APK es abrir
la demo, entrar como `chofer`, iniciar jornada y descargar una hoja de ruta.
