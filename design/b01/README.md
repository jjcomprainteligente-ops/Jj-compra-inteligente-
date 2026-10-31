# B01 · Tres propuestas de identidad

Prototipo visual **separado de la app de fase 1**. No modifica su entrada, pantallas, datos ni almacenamiento. El propietario ha seleccionado **V3 Verde Mercado y M3 provisional**; el logo definitivo se trabajará más adelante. Las tres alternativas, capturas, PDF y ZIP se conservan como evidencia de la entrega previa a la selección. B02 no ha comenzado.

## Revisar

- [Comparativa de Inicio](evidence/B01-comparativa-inicio.png).
- [Las tres marcas](evidence/B01-marcas.png).
- [PDF de cinco páginas](evidence/B01-propuestas.pdf): comparación, tres pantallas por dirección y pruebas de marca.
- [Galería HTML](review.html): funciona como documento local; sus imágenes están en `evidence/` y `assets/`.

Son capturas **de un prototipo web ejecutable** a escalas de iPhone, no de iOS nativo. En cada pantalla se identifican los datos de ejemplo. El presupuesto de 60 € es una muestra; los productos no tienen precios comerciales.

## Ejecutar sin cambiar la aplicación original

Desde la raíz del proyecto, las dependencias ya instaladas se comparten con este prototipo. Si es un checkout nuevo, ejecuta primero `npm ci` en la raíz; no hace falta instalar otro juego de dependencias aquí.

```sh
cd design/b01
npm run web
```

Abrir `http://localhost:8083/?variant=v1&screen=home`. Variantes: `v1`, `v2`, `v3`. Vistas: `home`, `empty`, `list`. El avatar JJ permite explorar las alternativas y el estado vacío; navegar aquí no registra una aprobación.

Inicio y Mi compra tienen navegación de muestra. Añadir productos, tocar filas, voz, Ahorro y Menús muestran una explicación del alcance. No hay permisos de micrófono, llamadas externas, persistencia ni funciones nuevas de negocio.

## Reproducir la evidencia

Node 24. Las herramientas de Expo y Playwright ya están en las dependencias del proyecto principal.

```sh
npm run typecheck
npm run export:web
npx playwright install chromium
node capture.cjs
node check-contrast.cjs
```

`capture.cjs` sirve temporalmente `build/` en localhost, toma 27 capturas y genera el PDF. Cierra el servidor al terminar. Si hay un Chromium del sistema, se puede indicar su ejecutable mediante `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. `B01_PORT` cambia el puerto de captura si 8083 está ocupado.

Para explorar la galería y las pantallas exportadas sin Metro:

```sh
node capture.cjs --serve
```

Abrir `http://127.0.0.1:8083/review.html`; el prototipo está en `/`. Este servidor es solo una herramienta de revisión local, no un backend de la aplicación.

## Evidencia y límites

- Tamaños CSS: 375×667, 390×844 y 430×932; imágenes con densidad 2×.
- `evidence/verification.json`: errores de JavaScript, desbordamiento horizontal, acción principal visible y ausencia de escrituras locales en los recorridos comprobados.
- `evidence/contrast.json`: contraste de 41 pares de texto/superficie, todos por encima de 4,5:1.
- No se ha validado iOS Safari, VoiceOver, Dynamic Type ni un teléfono físico. Las alturas comprobadas no incluyen barras reales de Safari ni teclado iOS.
- Verde Noche es una propuesta editorial con cabecera oscura y superficies claras, no un modo oscuro general.
- Las fuentes nativas de sistema pueden cambiar entre plataformas; V2 usa Georgia en iOS/web y serif del sistema en Android.
- No hay rama ni PR: el espacio disponible no contiene un repositorio Git operativo. Todo el trabajo es aditivo en esta carpeta y en la documentación incorporada.

## Activos

Monogramas e ilustraciones: vectores originales creados para esta exploración, sin imágenes de terceros ni generación por IA. Los SVG están en `assets/`; `monocromo-claro` significa tinta blanca y `monocromo-oscuro` tinta verde oscura. No confundir estos nombres con el color de su fondo.

Manrope ya existente: paquete con licencia MIT y fuente OFL-1.1. Lucide existente: ISC. React Native SVG existente: MIT. Georgia se usa como fuente de sistema, sin redistribuir archivos de fuente. No se han instalado dependencias ni activado servicios de pago. La disponibilidad legal de marca sigue pendiente.
