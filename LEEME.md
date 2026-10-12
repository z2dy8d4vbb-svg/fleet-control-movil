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
     tres cosas. Nombre exacto: `wolftech` (está en `codemagic.yaml`).
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
`FC_REGISTROS` (y en el maestro `fleet-nuevo.html`); cambiarlas obliga a
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

Cuando cambie `fleet-nuevo.html`:

1. Desde esta carpeta: `node herramientas/construir-movil.mjs ../fleet-nuevo.html ../demo/index.html` (regenera
   `www/index.html` con la configuración vacía, los logos neutros y sin
   nada de ninguna empresa; aborta si encuentra restos).
2. `git commit` + `git push`.
3. Start new build en Codemagic.

Cambios de nombre, icono o permisos: `capacitor.config.ts`,
`assets/` (+ `npm run assets`), `android/app/src/main/AndroidManifest.xml`
e `ios/App/App/Info.plist`.


## 6 · Lo que esta versión NO hace todavía

- **Notificaciones nativas.** En la web funcionan las notificaciones del
  navegador; dentro de la app de las tiendas no hay servicio de
  notificaciones todavía (hace falta el plugin de push, un servidor que
  las envíe y los archivos `google-services.json` / `GoogleService-Info.plist`
  de cada proyecto). Los chóferes ven los cambios al abrir la app.
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
