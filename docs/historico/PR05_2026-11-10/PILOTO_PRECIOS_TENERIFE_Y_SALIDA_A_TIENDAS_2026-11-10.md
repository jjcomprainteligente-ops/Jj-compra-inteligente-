# JJ Compra Inteligente — Piloto de precios públicos y salida a las tiendas
**Fecha:** 10/11/2026 · **Estado:** especificación de producto aprobada en sus principios por el propietario; integraciones técnicas PENDIENTES · **Ámbito:** Tenerife.

## Decisión del propietario
La aplicación ayuda a descubrir recetas, generar listas, evaluar gastos, comparar productos y planificar compras en una, varias o todas las tiendas seleccionadas. **JJ nunca procesa ni recibe pagos ni tiene checkout propio**: quien quiera comprar debe finalizar, confirmar y pagar exclusivamente en el sitio, la app o la caja física de cada establecimiento elegido. Las listas preparadas en JJ no equivalen a carritos transferidos a las tiendas. No presentaremos una transferencia automática de cesta como existente si no hay integración admitida.

El usuario pide probar primero un prototipo con información legítimamente visible y, con una demo funcional, solicitar a los comerciantes acceso oficial. No se autoriza scraping masivo, elusión de bloqueos, uso no consentido de APIs privadas ni afirmaciones de stock/precios en tiempo real.

## Fuentes estudiadas el 10/11/2026

| Cadena/fuente | Evidencia y enlace oficial | Alcance seguro del piloto | Limitaciones |
|---|---|---|---|
| HiperDino | https://www.hiperdino.es/ ; ej. https://www.hiperdino.es/c9500/derivados-lacteos-y-huevos/huevos.html | Fichas y precios públicamente consultables como referencias observadas manualmente con URL/fecha; probar salida a tienda online | Cambiar el código postal puede modificar tienda suministradora, surtido y precio. No asumir que catálogo online = stock o precio de cada tienda física; sin API o permiso confirmado |
| Lidl | https://www.lidl.es/c/descubre-nuevas-ofertas-cada-semana-folletos-lidl/s10087402 ; https://www.lidl.es/c/lidl-plus-en-canarias/s10089416 | Folletos de alimentación/ofertas, contexto de tienda y Lidl Plus | Tienda online de Lidl.es no es un checkout completo de alimentación; descuentos Lidl Plus condicionados. Folleto por tienda |
| ALDI | https://www.aldi.es/ofertas.html ; https://www.aldi.es/folleto.html | Ofertas publicadas y precios por región cuando se selecciona Canarias | ALDI España declara que no vende online; dirigir a información y tienda física, nunca a «pagar en ALDI online» |
| Mercadona | https://www.mercadona.es/ ; https://ayuda.tienda.mercadona.es/hc/es/articles/360001935371--El-nuevo-servicio-de-compra-online-llega-a-mi-c%C3%B3digo-postal | Catálogo y precios donde su web dé servicio al código postal seleccionado | Disponibilidad/compra dependen de dirección y modalidad; no dar por supuesto un carrito prellenado |
| Agromercado de Adeje | https://agromercadoadeje.com/listado-de-participantes-y-precios-semanales/ | Folletos/listados semanales públicos de productores, revisión manual | Precio final por puesto, unidad y semana; mercados físicos sin checkout digital garantizado |
| Mercatenerife (Cabildo, datos abiertos) | https://datos.tenerife.es/es/datos/conjuntos-de-datos/precios-diarios-de-productos-hortofruticolas-en-mercatenerife-2026- ; https://mercatenerife.com/precios_frame.php?l=1 | **Primer candidato para conexión automática permitida**: conjunto de datos diario JSON/CSV, licencia indicada CC Attribution, revisar API, esquema y condiciones antes de implementación | Precio mayorista orientativo €/kg, con min/máx/moda, origen local/no local, NO precio retail. Mostrar módulo separado «Indicadores del mercado», prohibida comparación como si fuese precio en caja |

**Nota de interpretación:** el mensaje «mercado» se cubre con Mercadona y mercados locales; confirmar cuál deseaba destacar no bloquea el piloto.

### HiperDino: modelos de tienda diferenciados
La cadena clasifica oficialmente https://www.hiperdino.es/c9504/nuevas-ubicaciones :
- **HiperDino:** > 2.000 m².
- **SuperDino:** 250–2.000 m².
- **HiperDino Express:** 250–700 m², enfocado a zonas turísticas con surtido adaptado.

Modelo de establecimiento: `chain_id` + `brand/format` + `store_id` + `store_name` + `postal_code` + `address` + `purchase_channel` + `data_coverage`. No sustituir establecimiento físico por tienda online genérica ni inferir equivalencia de precio, disponibilidad o stock.

## Experiencia de usuario — selector y flujos
1. **Zona:** elegir municipio/código postal de Tenerife (sin pedir ubicación precisa obligatoria).
2. **Tiendas:** tarjetas multiselección con `Seleccionar todas`, `Borrar selección`, `Solo esta`. Selección granular de cadena y, cuando exista información fiable, local físico (HiperDino, SuperDino, Express). Guardar preferencia local opcional. Si todas, mostrar explícitamente cuántas se incluyen.
3. **Recetas → ingredientes → lista:** ajustar raciones, gramajes, preferencias y alérgenos, revisar antes de añadir, conservar precios desconocidos como desconocidos.
4. **Comparación:** «Compra en una tienda», «Comparar mis tiendas», «Repartir entre tiendas» (solo como optimización orientativa con cobertura suficiente); mostrar productos no comparables, faltantes y precios antiguos. La suma de cesta solo incluye líneas con precio disponible y unidades comparables, nunca se llama coste completo de la cesta si faltan datos. Comparar €/kg, €/L, €/ud con marca, variedad, formato y origen compatibles.
5. **Presupuesto:** presupuesto inicial, coste observado con cobertura `n/N`, estimación explícita y gasto real introducido/confirmado por la persona, siempre separado. Descuentos asociados a tarjeta/cupón no son precio universal; no contar como obtenido sin condición aplicable.
6. **Salida externa:** botones claros `Abrir HiperDino`, `Abrir Mercadona` o `Ver oferta / Cómo comprar en tienda`; si la lista se reparte, agrupación por comercio y enlace independiente para cada uno. El sitio externo gestiona sesión, disponibilidad, cesta y pago. No mostrar `Pagar`, `Confirmar pedido` ni pedir datos bancarios en JJ. No afirmar que un enlace simple puede añadir la lista a un carrito.
7. **Sin compra online:** ALDI/Lidl alimentación y mercados sin checkout disponible ofrecen lista separada para llevar, fuente del folleto y acceso a la web/mapa de tienda.

### Estados obligatorios de la ficha de precio
- `PUBLICADO_OBSERVADO`: dato legible en fuente oficial, acompañado de URL, fecha/hora de consulta, región y alcance. **No representa feed oficial ni autorización de redistribución**.
- `APORTADO_USUARIO`: registro manual, no verificado por comerciante.
- `ESTIMADO`: valor de planificación, excluido de «precio oficial».
- `SIN_PRECIO`, `NO_DISPONIBLE`, `CADUCADO`, `NO_COMPARABLE`.
- `DATO_ABIERTO_MAYORISTA`: solo serie/indicador separado.
- Futuro `FEED_AUTORIZADO`: solo tras acuerdo, control de vigencia, alcance y prueba documental.

Para una demostración del motor de comparación se pueden crear ejemplos artificiales, **marcados «Datos de demostración» de forma persistente** y nunca mezclados con referencias públicas observadas. El interfaz no puede convertir ofertas públicas vistas manualmente en «precio confirmado en tu tienda».

### Contrato mínimo de una referencia
`id, product_name, normalized_product_id?, gtin?, brand?, variant?, package_amount, package_unit, price_eur, price_basis, price_per_standard_unit?, chain_id, store_id?, postal_code?, price_region?, channel, source_kind, source_url, observed_at, valid_from?, valid_until?, loyalty_conditions?, availability_status:"desconocida"|"confirmada por fuente autorizada", source_permission_status, confidence_label`.

No exigir GTIN para recetas genéricas: separar equivalencias nutricionales/categorías de coincidencia exacta comercial. Priorizar `gtin + tamaño` para comparaciones de marca, y `variedad+calidad+unidad` en frescos. Proteger los enlaces externos (solo HTTPS y dominio destino aprobado); nunca automatizar pago ni credenciales.

## Etapas y criterios de aceptación para Codex (sin cambios de código en este PR)
**P0 — Catálogo piloto curado.** Registrar 10–20 referencias de ejemplos **observados** con enlace, formato, zona, fecha, vigencia y régimen de acceso, si las condiciones de publicación lo permiten. Si no, usar valores de demo inequívocos, sin afirmar vigencia. Revisar fuente y términos antes de cualquier sincronización. Nunca incorporar catálogos enteros por extracción no autorizada.

**P1 — Selector y comparación sin checkout.** Implementar filtro una/varias/todas, formatos HiperDino, mostrar cobertura, alérgenos, carrito por comercio y salida externa. Reutilizar B03/B04/B05/B06 y su almacenamiento, sin migraciones destructivas ni modificar recetas aprobadas.

**P2 — Datos abiertos Tenerife.** Probar, en un módulo separado, ingestión de dataset JSON/CSV de Mercatenerife, atribución CC, manejo de fallos/caducidad, evitar mezclar mayorista y retail. Conservar cache solo bajo condiciones de licencia y minimización.

**P3 — Acuerdos comerciales.** Preparar demo, métricas reales de pruebas, ficha de privacidad, solicitar permiso escrito, feeds de catálogo/precio/stock por tienda y enlaces profundos a carrito si cada cadena los admite. **Aunque exista acuerdo, el pago permanecerá siempre externo a JJ.**

**Pruebas imprescindibles:** una tienda, dos, todas, ningún resultado, formato grande/Express, postal de otra zona, oferta caducada, cupón no activado, unidades incompatibles, ingredientes sin precio, sin red, enlace externo, tienda sin venta online, precios mayoristas segregados, restauración de selección, retorno desde navegador externo y accesibilidad iPhone. Sin prueba ejecutada no declarar implementación funcional.

## Riesgos y bloqueo explícito
- No hay acceso contratado ni API minorista confirmada en ninguna cadena. **Nunca confundir páginas públicas con permiso de extracción automatizada**.
- Las APIs no documentadas o privadas no son una base aceptable; uso comercial de fotos, marcas, descripciones y precios requiere revisión de derechos/condiciones.
- HiperDino y Mercadona requieren localización comercial correcta; ALDI exige configuración regional Canarias; Lidl selecciona tienda para folleto.
- Precios pueden cambiar antes de visitar/encargar. Gastos de envío, recogida, desplazamiento, mínimos, promociones y cupones deben desglosarse o dejarse como no disponibles.
- Los datos de Mercatenerife son precios orientativos mayoristas, no ofertas del consumidor.
- No hay app con esta integración publicada por esta entrega: **este documento solo deja la implementación lista para Codex**.
