# JJ Compra Inteligente

Aplicación de compra alimentaria con inteligencia artificial para Tenerife.

## Código fuente recuperado — 31/10/2026

GitHub es la base principal del código y la documentación. Vercel se utiliza para previews de prueba; cada nueva entrega debe identificar el commit que contiene y verificarse antes de compartirse.

El código editable se ha localizado en el proyecto Expo original. La nota técnica anterior se conserva como antecedente en [Estado técnico](docs/ESTADO_TECNICO_2026-10-31.md). Esta importación conserva los tres commits anteriores y el texto inicial de este README.

**Estado visual:** la app conserva todavía Verde Mercado con M3 provisional. No representa las pantallas canónicas GPT-6 V2. La conciliación visual sigue abierta y requiere los originales V2 y el logo oficial, actualmente no disponibles en el entorno. No confundir las antiguas propuestas B01 «V2 Verde Noche» con GPT-6 V2.

No existe una conexión de IA activa; las búsquedas con ChatGPT se hacen fuera de la aplicación.

## Guía de la aplicación existente

Aplicación móvil en español, inglés, alemán y francés para organizar listas de compra y presupuestos locales. B03/B04 integran las cinco pantallas de Verde Mercado, con M3 provisional y el comparador manual anterior conservado. B05 añade menús locales, recetas ajustables y revisión de ingredientes antes de guardarlos. No hay cuentas, backend ni fuentes comerciales conectadas.

## Idiomas — requisito transversal

La bienvenida detecta el idioma preferido compatible del dispositivo y permite elegir Español, English, Deutsch o Français. Puedes cambiarlo en Perfil → Idioma o volver al idioma del dispositivo. Una elección manual guardada tiene prioridad. Las traducciones ausentes recurren al español; los importes siguen en euros y se adaptan los formatos de números y fechas.

La preferencia usa una clave independiente. Los datos existentes, identificadores y cantidades no se reescriben al cambiar idioma. Las recetas, formularios, errores y etiquetas accesibles tienen recursos centralizados. La preparación del idioma de un futuro asistente es local y no realiza llamadas de IA.

[Contrato y plan](docs/I18N_CONTRATO_Y_PLAN.md) · [Entrega y auditoría](docs/I18N_ENTREGA_Y_AUDITORIA.md) · [Prueba guiada en iPhone y web](docs/I18N_PRUEBA_GUIADA.md).

## Listas y presupuesto — B03/B04

Desde Inicio crea una lista; en Mi compra añade, edita y marca productos con cantidades, unidades, categorías, notas y precios opcionales. Puedes mantener varias listas y cambiar su nombre. Los borrados requieren confirmación; el último borrado o marcado puede deshacerse antes de otra modificación guardada.

El presupuesto es tu límite. La previsión suma precios introducidos y estimaciones, mientras que el gasto registrado solo incluye productos marcados con precio introducido. Los productos sin precio se muestran como pendientes de información. Los datos solo cambian en pantalla después de guardarse correctamente; los errores de lectura no borran el almacenamiento.

La entrada es `index.ts` → `src/app/ShoppingApp.tsx`. Los componentes, pantallas, reglas de dominio y almacenamiento tienen responsabilidades separadas. El comparador conserva `App.tsx` y su clave local; se abre desde Ahorro → Abrir comparador manual o, en web, `/?view=comparisons`.

[Entrega y límites de validación](docs/B03_B04_ENTREGA.md). Las propuestas B01 y B02 permanecen en `design/`; no forman parte de la entrada de producción. El archivo previo a B03/B04 se conserva en `archives/B00-B02-source-before-B03-B04.zip`.

## Menús y recetas — B05

En Menús puedes preparar cinco cenas para 1–12 personas, cambiar platos y abrir los pasos e ingredientes de cada receta. El plan queda guardado en este dispositivo. Antes de añadir ingredientes, «Esto he entendido» permite editar cantidades y unidades, quitar productos y resolver los que ya existen. La confirmación guarda todo el grupo; puedes deshacerlo. Los ingredientes entran sin precio y el presupuesto anterior se conserva.

También puedes traer texto de ChatGPT, un ingrediente por línea (`500 g arroz`, `2 L leche`, `3 huevos`). El parser usa reglas locales y pide corregir las líneas ambiguas; no consulta una IA, no guarda el texto como historial y no necesita una clave. Las búsquedas se hacen fuera de la app.

[Entrega B05](docs/B05_ENTREGA.md) · [Prueba guiada en iPhone](docs/B05_PRUEBA_GUIADA.md) · [Capturas B05](design/b05/review.html).

## Comparador piloto — B06

Desde Ahorro abre «Comparar formatos y fuentes». Registra producto, marca, formato, calidad/variante, tienda, contenido total, precio del envase, fecha y procedencia. Las aportaciones recientes se comparan por kg, L o unidad únicamente si los productos y sus dimensiones son equivalentes. Las antiguas, demostraciones, orígenes sin verificar y precios pendientes quedan fuera, con su motivo visible.

No hay fuentes verificadas conectadas ni precios en tiempo real. El piloto admite aportaciones manuales, sin convertirlas en precios actuales verificados. El comparador anterior permanece disponible con sus datos y su cálculo de precio más envío. Las observaciones nuevas no modifican tus compras o menús.

[Entrega B06](docs/B06_ENTREGA.md) · [Capturas B06](design/b06/review.html).

## Ejecutar en Android e iPhone

Necesitas Node.js 24 LTS, npm y una versión de Expo Go compatible con Expo SDK 58. Si tu versión de Expo Go no admite este SDK, utiliza una compilación de desarrollo compatible de Expo.

```sh
cd jjcompraintelwgiemt
npm ci
npm start
```

Mantén el ordenador y el teléfono en la misma red y sigue las instrucciones de Expo para abrir el proyecto. En Android, escanea el QR desde Expo Go. En iPhone, escanéalo con la cámara y ábrelo en Expo Go.

Con un emulador Android configurado puedes usar `npm run android`. Para un simulador iOS utiliza `npm run ios`; el simulador requiere macOS y Xcode. La ejecución en dispositivos físicos y simuladores nativos está pendiente de validación.

## Vista previa en el navegador

```sh
npm run web
```

La vista web permite probar los flujos en un navegador. Sus datos locales son independientes de los del teléfono y de otros navegadores o perfiles. Esta vista previa no sustituye la comprobación en Android e iOS.

## Uso del comparador anterior

1. Crea una comparación con el nombre del producto.
2. Añade las ofertas que quieras contrastar. Usa un enlace `https://` o `http://` y comprueba que corresponden al mismo producto.
3. Escribe el precio y los gastos de envío. El envío comienza en **0 €** y puedes editarlo. Se aceptan coma o punto decimal, hasta dos decimales e importes positivos o cero.
4. Consulta el total de producto más envío y abre la oferta para visitar la tienda.
5. Edita las ofertas o el nombre de la comparación cuando cambien. Las eliminaciones requieren confirmación.

Los precios se introducen manualmente: no se importan desde los enlaces ni se consultan o actualizan en las tiendas. El comparador contrasta un producto entre tiendas. Los presupuestos de Mi compra son independientes de esas comparaciones. No incluye cuentas, sincronización ni pagos.

## Fase 1 y búsquedas con ChatGPT

La fase 1 original contiene la estructura inicial y el comparador manual, conservados en esta entrega. Las búsquedas se hacen con ChatGPT, fuera de la aplicación. Después se copian a cada oferta la tienda, el enlace del producto, el precio y el envío. Comprueba esos importes en la tienda antes de guardarlos. Esta fase no necesita una clave de API ni integra un buscador.

La estructura separa la interfaz (`App.tsx`, `src/screens.tsx` y `src/components/`), las reglas de comparación (`src/domain/`), el guardado (`src/storage/`) y las pruebas (`tests/`). Así se puede ampliar la app sin mezclar los cálculos con las pantallas.

## Guardado local

Las listas, presupuestos y comparaciones se guardan en el dispositivo mediante AsyncStorage, en claves independientes. Desinstalar la aplicación o borrar sus datos puede eliminarlas. En la vista web, borrar los datos del navegador también elimina las comparaciones guardadas. No existe copia en un servidor.

Los cambios se muestran como guardados después de que finalice la escritura. Si falla la carga o el guardado, se muestra un error para volver a intentarlo. Los datos que no se puedan leer no se reemplazan automáticamente.

## Comprobaciones del proyecto

```sh
npm run check
```

Este comando ejecuta TypeScript y las pruebas de Vitest. También puedes ejecutar `npm run typecheck`, `npm test` o `npm run test:watch` por separado. Las 496 pruebas actuales cubren importes exactos, cantidades, presupuestos, duplicados, validación, traducciones, preferencias y almacenamiento local, incluidos datos corruptos, conflictos entre instancias y fallos de lectura, reserva o confirmación de escritura.

Para la validación manual, comprueba en Android e iOS: crear una comparación, añadir dos ofertas con diferentes gastos de envío, empatar sus totales, editar y eliminar con confirmación, abrir un enlace y cerrar/abrir la aplicación para verificar la persistencia. Revisa también el teclado decimal y los formularios con el teclado visible.

Se incluyen pruebas de los recorridos web en tamaños de ordenador y móvil:

```sh
npx playwright install chromium
npm run test:web
```

El comando inicia Expo si no hay un servidor en el puerto 8081. La auditoría actual ejecutó 124 recorridos correctos de escritorio/móvil, incluidos los anteriores, los cuatro idiomas y la concurrencia. Doce casos de captura duplicados en el segundo proyecto se omiten deliberadamente; las 120 capturas completas se producen una vez. Las pruebas en teléfonos físicos siguen pendientes. La generación de paquetes JavaScript no equivale a una compilación instalable ni a una prueba en un dispositivo.


Para reproducir la evidencia sobre la aplicación exportada:

```sh
npm run build:i18n
npm run verify:i18n
```

Necesitas Chromium instalado por Playwright (`npx playwright install chromium`) o indicar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. El script sirve `dist-i18n/` en localhost:8081 y genera una carpeta fechada nueva en `design/i18n/evidence/`, conservando las entregas anteriores. El puerto debe estar libre. Los datos ficticios se introducen solo en contextos de prueba; la app inicia vacía. Los antiguos scripts de captura B05/B06 se conservan como antecedentes y no deben utilizarse para sobrescribir sus pruebas.

La web protege las escrituras con Web Locks y huellas transaccionales en IndexedDB; requiere HTTPS o localhost y un navegador con durabilidad estricta disponible. No se reemplazan los cuatro almacenes existentes. Una reserva pendiente o un resultado incierto bloquea nuevas escrituras para proteger los datos. Una IP de la red local por HTTP puede carecer de estas capacidades. El acceso nativo de Expo utiliza su cola local, sin IndexedDB.

La auditoría completa de dependencias sigue abierta: el informe actual registra 13 paquetes afectados en herramientas de Expo (2 altos, 9 moderados, 2 bajos, 0 críticos). No hay parches compatibles en los rangos consultados; no forzar cambios de versión mayores ni una rebaja a Expo 51. Los detalles, límites y requisitos antes de distribución están en [la auditoría multilingüe](docs/I18N_ENTREGA_Y_AUDITORIA.md).


## GitHub y estado visual

El código importado y su reproducción desde un clon nuevo están documentados en [Entrega G00 y auditoría](docs/github/G00_ENTREGA_Y_AUDITORIA.md). GitHub es la base principal; las previews Vercel identifican su commit de origen.

La [conciliación GPT-6 V2](docs/V2_CONCILIACION_VISUAL_2026-10-31.md) registra las diferencias actuales y la recuperación pendiente de los originales. La vista actual continúa con M3 provisional y el diseño anterior.
