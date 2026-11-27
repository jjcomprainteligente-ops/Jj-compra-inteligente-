# B08.3 · Evidencia de comparación manual

La alternativa elegida son tarjetas verticales dentro de la revisión manual existente, frente
a una tabla de dos columnas. Conserva Verde Mercado Premium, Manrope y el PNG oficial.
La [especificación acotada](../../docs/MAESTRO/BLOQUE08_3_COMPARACION_MANUAL.md) distingue
precios manuales, confirmación de identidad, envases completos y condiciones para comparar.

La matriz reproducible se preparará en `playwright.basket-comparison.config.ts` para cuatro
idiomas, Chromium y WebKit a 375/430 píxeles. Fixtures sintéticos aislados y rotulados QA;
no se incorporan como datos iniciales de la aplicación. Capturas y resultados completos
permanecen en el directorio privado de evidencia; trazas y vídeo desactivados.

Los recibos públicos de cierre contendrán alcance, contadores y hashes, sin datos personales,
credenciales ni enlaces que concedan acceso. WebKit no certifica un iPhone físico.
