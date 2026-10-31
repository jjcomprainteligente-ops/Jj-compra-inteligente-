# Evidencia B05

El capturador usa la app principal exportada, servida por separado en `http://127.0.0.1:8081`. No inicia servidores ni servicios externos y escribe exclusivamente en `design/b05/`.

```sh
node scripts/capture-b05.cjs
```

Permite `B05_ORIGIN` para otra dirección y `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para Chromium del sistema. Si no se indica ruta ni existe `/usr/bin/chromium`, utiliza el navegador instalado por Playwright.

Prepara 12 estados en 375×667, 390×844 y 430×932 CSS px, más dos vistas con texto web simulado al 130 %: 38 capturas previstas, galería `review.html` e informe `evidence/report.json`. La lista y el menú ficticios se introducen solo en contextos de navegador aislados. El capturador no confirma ninguna incorporación correcta a compras; comprueba que los datos de muestra permanezcan intactos incluso en la captura de error de escritura.

Se registran errores JavaScript y desbordamientos; el script termina con error si los detecta o cambia el almacenamiento de compras de muestra. No valida un iPhone nativo, VoiceOver ni Dynamic Type. No solicita IA, voz o precios comerciales. Los avisos de herramientas Expo y los requisitos nativos siguen documentados en las entregas técnicas.

La existencia de este script no significa que las capturas ya se hayan ejecutado ni que hayan superado las comprobaciones.
