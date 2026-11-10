# B06 | Comparador de precios piloto
**Estado inicial:** PENDIENTE | **Dependencia:** B04 aprobado y fuente de precios legítima.
**Objetivo:** ofrecer comparaciones útiles sin datos engañosos.

## Encargo a Codex
1. Preparar modelo de observación de precio: establecimiento, producto/formato, cantidad/unidad, precio, precio normalizado, fecha y procedencia.
2. Diferenciar precio verificado, aportado por usuario, antiguo, desconocido y demo.
3. Comparar únicamente productos equivalentes por formato, calidad y unidad; mostrar excepciones.
4. Diseñar estados sin fuente/con múltiples fuentes/conflictos de unidades.
5. Para el piloto usar exclusivamente fuentes autorizadas o aportaciones manuales explícitamente etiquetadas. No scraping prohibido.

## Aceptación
- [ ] Ninguna estimación se muestra como precio actual.
- [ ] Cada observación tiene fuente, tienda y fecha.
- [ ] Precios €/kg o €/L cuando corresponda.
- [ ] La pantalla sigue siendo útil sin partners.
- [ ] Cualquier supuesto ahorro es trazable y verificable.
