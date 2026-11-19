# B09 | Compra integrada real: fase posterior
**Estado inicial:** BLOQUEADO | **Dependencias:** B08, acuerdos comerciales, aspectos legales/operativos.
**Objetivo:** posibilitar checkout real solo con permisos, datos y responsabilidades contractuales.

## Encargo condicionado a autorizaciones
1. Documentar acuerdos retailer, derechos de catálogo/precios, API y restricciones.
2. Confirmar quién cobra, vende, factura, prepara, entrega, sustituye y tramita devoluciones.
3. Validar integración de stock, identidad, impuestos, envíos, disponibilidad geográfica, errores y seguridad.
4. Diseñar autorización de pagos adecuada (proveedor certificado/redirect) y evitar tratar tarjetas directamente si no se requiere.
5. Implementar en ramas y sandbox separados solo tras aprobación.

## Aceptación
- [ ] Acuerdo/API probado, no supuesto.
- [ ] Flujos de pago y pedido auditados.
- [ ] Precios/stock y sustituciones tratados explícitamente.
- [ ] Protección de datos, soporte y obligaciones legales revisadas.
- [ ] Aprobación para lanzamiento de comercio real.
