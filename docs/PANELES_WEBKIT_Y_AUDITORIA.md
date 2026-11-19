# Paneles accesibles y verificación WebKit

Entrega iniciada el 10 de noviembre de 2026 desde `936459d`, rama `codex/mobile-readiness`, con base en la entrega de filtros y privacidad. Mantiene las referencias GPT-6 V2, Verde Mercado Premium, los cuatro idiomas, el logo original y el historial. No añade funciones comerciales ni servicios.

## Pareja de bloques

| Bloque | Alcance |
|---|---|
| A · Paneles y campos compartidos | Zona segura inferior; fondo táctil fuera del recorrido accesible; foco en el diálogo al cambiar de paso; retorno al disparador cuando el autofocus impide la restauración de RNWeb; ayudas asociadas al campo; callbacks de foco conservados. |
| B · Compatibilidad y preparación del piloto | Suite WebKit separada y reproducible; revisión de capacidades reales de guardado; cuatro idiomas; prueba reforzada de texto al 200 %; guía de aceptación física. |

Durante la comprobación se reprodujeron dos defectos de foco en los cuatro idiomas: destino inicial en la superficie exterior y foco perdido al sustituir un campo por la confirmación. Las pruebas también detectaron falta de retorno al disparador tras descartar un editor con autofocus. El teclado no debe disparar una acción destructiva al cambiar de paso.

La revisión de capturas al 200 % encontró un caso que la primera aserción de foco no detectaba: encabezado y pie podían dejar sin espacio útil al cuerpo en 320×568. El criterio exige contenido visible y tocable mediante desplazamiento, además de foco. Una simulación CSS no acredita Dynamic Type.

El panel mantiene la cabecera y acciones fijas cuando hay espacio. Si su altura medida deja menos de un área legible para el cuerpo, pasa a un único desplazamiento que incluye todo el panel. Este modo se mantiene hasta cerrar para evitar oscilaciones. No reduce el tamaño de texto. Los borradores y confirmaciones viven en sus componentes propietarios, fuera del contenido que cambia de disposición.

## Contratos conservados

- RNWeb Modal sigue proporcionando confinamiento de foco, Escape y restauración normal; no se añade otro trap ni un listener global de teclado.
- Cerrar sigue pasando por el controlador del flujo. Durante un guardado pendiente se bloquean Escape y cierre exterior; el borrador no sustituye un documento guardado sin confirmación.
- La confirmación de privacidad conserva palabra, casilla, revisión vigente y protección de escritura. Las copias siguen limitadas a los siete documentos permitidos.
- No se crean claves, migraciones, cuentas, IA conectada, sincronización, permisos automáticos ni dependencias de aplicación.
- El euro permanece como moneda. Las recetas del propietario se integrarán cuando se reciban; el catálogo inicial de siete no representa las 150 pendientes.

## Verificación y evidencia

Auditoría final completada: TypeScript y 758 pruebas unitarias correctos; 248 casos Chromium y 42 WebKit correctos, cero fallos/intermitentes. Chromium registra 24 omisiones deliberadas de matrices duplicadas. Las exportaciones web/iOS/Android terminan correctamente. La pasada completa verifica 420 capturas base, 48 nuevas de paneles y la conservación de los artefactos anteriores; WebKit añade 40 capturas locales de la misma compilación. Los 75 archivos de referencia permanecen íntegros.

Los resultados públicos están en `design/mobile-readiness/reports/`. La fuente independiente revisada coincide por SHA-256 con los tres archivos finales. Los ensayos anteriores se conservan como diagnóstico y no sustituyen la pasada final sobre `dist-mobile-readiness-final`, bundle `index-fe02e3bce353424b4b19f01c54ffcddc.js`, SHA-256 `0a529f2fdb11c628e012fdf1a71786a59deeddfdc4500d3238279d537897c409`.

Comandos reproducibles desde una instalación preparada:

```sh
npm run typecheck
npm test
EXPO_NO_TELEMETRY=1 npx expo export --platform all --output-dir dist-mobile-readiness-final --max-workers 2
JJ_EXPORT_DIRECTORY=dist-mobile-readiness-final node scripts/verify-v2.cjs
```

La suite Chromium requiere su navegador instalado; este entorno utiliza `/usr/bin/chromium`. Para WebKit, instalar el navegador y sus bibliotecas oficiales con el mecanismo admitido por el entorno, servir esa misma exportación en `127.0.0.1:8081` y ejecutar:

```sh
npx playwright test --config playwright.webkit.config.ts
```

La configuración WebKit guarda una carpeta de resultados nueva y no inicia Expo ni modifica la matriz Chromium. En este entorno, las bibliotecas Debian 13 ausentes se extrajeron de paquetes oficiales únicamente en scratch; el launcher y los paquetes de QA no forman parte de la app ni del despliegue. Los informes identifican motor, capacidades, compilación y límites. No se simulan primitivas para declarar apto el guardado.

Las capturas y trazas se mantienen locales. Los informes públicos contienen resultados de contextos aislados con datos ficticios, sin copias personales ni credenciales de enlaces compartidos.

## Seguridad y aceptación pendiente

La consulta npm del 10 de noviembre mantiene **cinco avisos moderados, cero altos y cero críticos**. Corresponden a dos advisories transitivos de glob/minimatch en las herramientas de Expo. No existe hoy un parche dentro de los rangos oficiales admitidos; no se aplicaron overrides ni la degradación de Expo sugerida por `audit fix --force`. [Análisis de versiones](../design/mobile-readiness/reports/dependency-review.md). La consulta nueva quedó registrada en el informe de texto; el JSON de la entrega anterior conserva su fecha y no se presenta como actual.

La aprobación visual y las pruebas en iPhone físico, Safari iOS, VoiceOver/TalkBack, Dynamic Type, teclado nativo, orientación y panel Compartir siguen pendientes. [Guía de aceptación](IPHONE_PRUEBA_DE_PANELES.md). WebKit automatizado en Linux añade evidencia del motor; no certifica esos dispositivos.

Esta pareja no completa por sí sola B00–B09, las variantes adicionales de marca/3D, la biblioteca persistente de las 150 recetas ni los módulos de hogares o comercio condicionados.


### Publicación verificada — 2026-11-10

Fuente de aplicación: `23bde4371aa041a6ab96ab2f62afe815a6f5c472`, [PR #7](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/7), base en la entrega de filtros/privacidad. Preview `staging` READY: `dpl_BX1bmmAu4j653jPPJ3oS9AqjFp6K`, URL base https://jj-compra-inteligente-e3qq1imu1-cmj2hwhc6b-1051.vercel.app . Protección conservada. Verificación remota correcta en es/en/de/fr y 27 recursos por bytes/hash, incluidos filtros, guardado, menús, copia JSON exacta y borrado confirmado aislado. El enlace temporal se entrega únicamente en la conversación; vence el 11 de noviembre de 2026 a las 15:00:33 UTC. Su credencial queda fuera de GitHub. Informe: `design/mobile-readiness/reports/hosted-verification.json`.

Los borradores separados [PR #4, piloto de tiendas](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/4) y [PR #5, especificación de precios y salida externa](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/5) se localizaron en GitHub y permanecen intactos. No forman parte de esta preview ni se fusionaron automáticamente; su validación e integración es una entrega posterior. Se conserva el historial y no se promueve a producción. La prueba física, la revisión visual, las 150 recetas y los cinco avisos moderados siguen pendientes.
