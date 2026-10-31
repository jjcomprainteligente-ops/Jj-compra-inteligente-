# Evidencia B06

El capturador utiliza la aplicación principal exportada y servida por separado en `http://127.0.0.1:8081`. No inicia un servidor y escribe exclusivamente en `design/b06/`, conservando los informes y capturas anteriores.

```sh
node scripts/capture-b06.cjs
```

Acepta `B06_ORIGIN` y `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Si no se indica ejecutable y no existe `/usr/bin/chromium`, utiliza el navegador instalado por Playwright.

Prepara 13 estados en 375×667, 390×844 y 430×932 CSS px, más dos vistas con texto web simulado al 130 %: **41 capturas previstas**. Incluye entrada desde Ahorro, vacío, importes normalizados, incompatibilidades, alta/edición, referencia, demostración excluida, cantidad/fecha inválidas, carga corrupta, fallo de guardado y confirmación de eliminación.

Todos los comercios, marcas, importes y referencias son **datos ficticios de prueba**. Algunas muestras se marcan manuales para probar ese flujo, sin implicar observaciones comerciales reales. La galería y las procedencias lo indican expresamente. Los contextos son aislados, no se precargan precios en la aplicación y no se consulta ninguna tienda.

`evidence/report.json` registra dimensiones, errores JavaScript, desbordamientos y conservación de las claves de compra, menús y comparaciones anteriores. También comprueba que las escenas no modifiquen el conjunto de observaciones de muestra. El script termina con error si detecta esas incidencias.

La creación del capturador no significa que ya se haya ejecutado. Las imágenes son Chromium web, no una validación de iPhone nativo, VoiceOver, teclado o Dynamic Type. Los avisos de dependencias de herramientas Expo siguen abiertos según la entrega técnica.
