# B08.2 · Evidencia de revisión manual

La subvista reutiliza Verde Mercado Premium y los componentes existentes. Las alternativas
de ubicación presentadas antes de implementar se recogen en el [informe del bloque](../../docs/MAESTRO/BLOQUE08_2_CESTA_MANUAL.md).

La matriz reproducible se encuentra en `playwright.manual-basket.config.ts`, con cuatro idiomas,
Chromium y WebKit a 375 y 430 píxeles. Fixtures exclusivamente sintéticos, identificados como QA;
no se incorporan como datos iniciales de la app. Capturas, trazas desactivadas, resultados y
credenciales temporales permanecen fuera de Git en el directorio privado de la entrega.

Los informes públicos de cierre contendrán contadores, hashes y alcance, sin datos personales
ni enlaces que concedan acceso. Una simulación WebKit no acredita un iPhone físico.

Auditoría cerrada: 52 casos locales y ocho casos nuevos alojados correctos.
[Recibo público](reports/verification.json) y [comprobación local](reports/local-preparation.json).
