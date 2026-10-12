# Fleet Control · publicar en Google Play y App Store

Orden recomendado: **Android primero** (se instala sin tienda y se puede
probar hoy), TestFlight después, y las fichas de las tiendas cuando la app
haya hecho una jornada real en un móvil.

Material que ya está hecho y dónde:

| Qué | Dónde |
|---|---|
| Proyecto compilable (Codemagic) | `fleet-control-movil/` · ver su `LEEME.md` |
| APK de prueba, instalable hoy | `fleet-control-movil-apk/app-debug.apk` |
| Icono 512 px (Play) y 1024 px (App Store) | `fleet-control-movil/assets/icon.png` (1024) · Play acepta reducirlo |
| Capturas de pantalla | `capturas-tiendas/iphone` (1290×2796) · `capturas-tiendas/android` (1080×2340) |
| Política de privacidad | `subir-a-wolftech/privacidad/index.html` → https://wolftechsoluciones.com/privacidad/ |
| Registro de empresas | `subir-a-wolftech/app/empresas/` → https://wolftechsoluciones.com/app/empresas/ |
| Cuenta para los revisores | código de empresa `demo` · usuario `demo` · contraseña `demo1234` (chófer: `chofer` / `demo1234`) |

Textos de la ficha (los mismos en las dos tiendas):

> **Nombre:** Fleet Control
> **Subtítulo / descripción corta:** Gestión de flota para empresas de transporte de viajeros.
> **Descripción:** Fleet Control es la herramienta de trabajo de las empresas de transporte de viajeros: la oficina organiza los servicios, asigna vehículos y chóferes y sigue la flota en el mapa; cada chófer ve su jornada, inicia y cierra el servicio, registra kilómetros, repostajes e incidencias y comparte la hoja de ruta. Un solo lugar para viajes, agenda, flota, mantenimiento, gastos y liquidaciones. Fleet Control es para empresas: necesitas un código de empresa y un usuario que te da tu oficina. Si quieres verla, pide una demostración en wolftechsoluciones.com.
> **Categoría:** Empresa / Productividad. **Precio:** gratis (la licencia se contrata aparte).

---

## Google Play

Cuenta: la de desarrollador que ya tienes (dev@wolftechsoluciones.com).

1. **Play Console → Crear aplicación.** Nombre "Fleet Control", idioma español, tipo Aplicación, gratis.
2. **Contenido de la app** (todo obligatorio antes de publicar):
   - *Política de privacidad*: https://wolftechsoluciones.com/privacidad/
   - *Acceso a la app*: "Toda la funcionalidad o parte está restringida" → añade
     instrucciones: "Pantalla inicial: código de empresa `demo`. Después
     usuario `demo`, contraseña `demo1234` (oficina) o `chofer` / `demo1234`
     (chófer)". Sin esto rechazan la app porque no pueden entrar.
   - *Anuncios*: no.
   - *Clasificación de contenido*: cuestionario, categoría Utilidad; todo
     "no" → apto para todos.
   - *Público objetivo*: 18 o más.
   - *Apps de noticias / COVID / gobierno / finanzas / salud*: no a todo.
   - *Seguridad de los datos* (Data safety), respuestas exactas:
     - Recoge datos: sí. Cifrados en tránsito: sí. Se pueden solicitar
       borrar: sí (vía la empresa o info@wolftechsoluciones.com).
     - Ubicación → Ubicación precisa y aproximada: recogida, no compartida,
       opcional (solo chóferes con jornada iniciada), finalidad:
       funcionalidad de la app.
     - Información personal → Nombre, Dirección de correo, Número de
       teléfono: recogidos, no compartidos, obligatorios, finalidad:
       funcionalidad de la app y gestión de la cuenta.
     - Identificadores de dispositivo: no (el token de notificaciones no se
       usa en la app nativa todavía).
     - Nada más: ni fotos, ni archivos, ni contactos, ni actividad de
       navegación, ni datos financieros (los importes de los servicios son
       datos de la empresa, no "información financiera" del usuario).
3. **Ficha de Play Store**: descripción corta y larga (arriba), icono 512 px,
   gráfico de funciones 1024×500 (haz uno con el logo sobre fondo #0a1018;
   Canva vale), capturas de `capturas-tiendas/android` (mínimo 2, hay 9).
4. **Firma**: acepta "Firma de aplicaciones de Google Play". La clave de
   subida es el almacén de Codemagic (`fleet_control_keystore`).
5. **Pruebas → Prueba interna**: sube el `app-release.aab` de Codemagic,
   añade tu correo como probador, instala desde el enlace. Es la vía normal
   de actualizar también.
6. **Producción**. OJO: las cuentas de desarrollador **personales** creadas
   después de noviembre de 2023 tienen que pasar antes por una prueba cerrada
   con al menos 12 probadores durante 14 días seguidos y luego pedir acceso a
   producción. Compruébalo en tu consola (aparece como requisito al crear la
   versión de producción). Si te afecta, los 12 probadores salen de los
   grupos de WhatsApp de VTC de Ibiza: es, además, la mejor campaña posible.

Revisión de Google: horas o pocos días. Rechazos típicos: no poder entrar
(punto 2), política de privacidad que no abre, permiso de ubicación sin
explicar en la ficha (está explicado en la descripción y en la política).

---

## App Store

1. **Apple Developer Program**, 99 €/año (developer.apple.com). Como
   particular sale a tu nombre en la tienda; como
   empresa hace falta número D-U-N-S y la sociedad. Para empezar, particular;
   se puede transferir la app después.
2. **App Store Connect → Apps → +**: plataforma iOS, nombre "Fleet Control",
   idioma español, bundle id `com.wolftechsoluciones.fleetcontrol` (si no
   aparece, créalo en developer.apple.com → Identifiers, o deja que
   Codemagic lo cree en la primera compilación), SKU `fleetcontrol`.
3. **Clave API** para Codemagic (ver `fleet-control-movil/LEEME.md`, paso
   iPhone). Con eso la primera compilación en Codemagic sube el build a
   TestFlight: instálalo en tu iPhone con la app TestFlight y pruébalo.
4. **Privacidad de la app** (etiquetas), lo que hay que marcar:
   - Ubicación → Ubicación precisa: vinculada al usuario, para
     funcionalidad de la app. No se usa para seguimiento (tracking) ni
     publicidad.
   - Información de contacto → Nombre, Correo electrónico, Número de
     teléfono: vinculados al usuario, funcionalidad de la app.
   - Identificadores → ID de usuario: vinculado, funcionalidad de la app.
   - Nada más. "¿Realiza seguimiento?": no.
   - URL de la política de privacidad: https://wolftechsoluciones.com/privacidad/
5. **Información de revisión**: cuenta de demostración → usuario `demo`,
   contraseña `demo1234`, y en *Notas*: "La app es para empresas. En la
   primera pantalla introduzca el código de empresa `demo`; después las
   credenciales. Para ver la vista de chófer: usuario `chofer`, contraseña
   `demo1234`. La ubicación solo se usa con la app abierta y una jornada
   iniciada". Teléfono de contacto: +34 603 96 96 20.
6. **Ficha**: capturas de `capturas-tiendas/iphone` (6,7": 1290×2796; hay 8;
   Apple reutiliza este tamaño para el resto), descripción, palabras clave
   ("flota, transfers, VTC, chófer, transporte, viajeros"), categoría
   Empresa, clasificación 4+, URL de soporte https://wolftechsoluciones.com.
7. **Cumplimiento de exportación**: ya contestado en el proyecto
   (`ITSAppUsesNonExemptEncryption = false`): no pregunta en cada build.
8. **Enviar a revisión**. Suelen tardar 1-3 días. Lo que mira Apple en una
   app así: que no sea "una web metida en una app" (tiene GPS nativo, hoja
   de compartir y pantalla de arranque propias: vale), que se pueda entrar
   (punto 5), que la política de privacidad coincida con las etiquetas
   (coincide), y que no pida la ubicación sin explicar por qué (el texto
   está en Info.plist).

---

## Lo que conviene saber antes de la primera venta con app

- **Una sola app para todas las empresas.** Apple rechaza "apps de
  plantilla" repetidas para cada cliente (directriz 4.2.6); por eso Fleet
  Control entra por código de empresa. Si algún día un cliente grande quiere
  SU app con SU nombre en la tienda, se publica desde SU cuenta de
  desarrollador con la configuración incrustada (el mismo proyecto; basta
  con rellenar FC_EMPRESA en `www/index.html` y cambiar id, nombre e icono).
- **Notificaciones nativas** no están en esta versión (en la web sí). Es el
  siguiente trabajo técnico si los chóferes las piden: plugin de push, un
  servidor que las envíe (una Cloud Function) y los archivos de Firebase de
  cada proyecto en la app, lo que obliga a recompilar al añadir empresas o
  a usar un proyecto de notificaciones común.
- **Ubicación en segundo plano**: tampoco. Con la app en pantalla, sí.
- **Cambiar de empresa**: en la pantalla de entrada, debajo del crédito,
  "Empresa: X · cambiar".
