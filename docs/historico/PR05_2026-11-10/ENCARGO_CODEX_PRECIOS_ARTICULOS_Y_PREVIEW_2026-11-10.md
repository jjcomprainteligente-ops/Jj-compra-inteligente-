# Encargo ejecutable para Codex · JJ Compra Inteligente · Precios y artículos
**Fecha:** 2026-11-10 · **Estado:** preparación documental, NO implementación ni despliegue · **Mercado:** Tenerife · **Asociado:** issue #6, PR de producto #5, PR previo de tiendas #4.

## Objetivo visible para el propietario
En la aplicación Expo existente, ir de **Receta → Lista → Ahorro → Mis tiendas → Comparar cesta → Abrir comercio**. Seleccionar UNA, VARIAS o TODAS las cadenas y ver un presupuesto orientativo con procedencia, cobertura y faltantes; cuando un comercio no ofrece compra online, ver una lista para comprar presencialmente. **Nunca pagar, confirmar un pedido o capturar datos bancarios en JJ.** No simular transferencia automática de carrito ni precios en tiempo real.

## Condiciones previas: no repetir ni destruir trabajo
1. Leer `AGENTS.md`, `README.md`, `docs/PRODUCTO_Y_ALCANCE.md`, `docs/PLAN_Y_ESTADOS.md`, `docs/DECISIONES_Y_RIESGOS.md`, `docs/PILOTO_TIENDAS_Y_PRECIOS_2026-11-10.md` en `codex/tiendas-precios-piloto` y `docs/PILOTO_PRECIOS_TENERIFE_Y_SALIDA_A_TIENDAS_2026-11-10.md` en PR #5.
2. **No partir de `main` a ciegas.** El PR #4 (`codex/tiendas-precios-piloto`) ya implementa selección múltiple, favoritos y destinos; contiene la evolución de V2. PR #7 (`codex/mobile-readiness`) añade accesibilidad/teclado/WebKit y permanece abierto. Comparar ramas y sus historias, escoger base que conserve V2, filtros, menús, imágenes, cuatro idiomas y accesibilidad; solucionar conflictos de forma explícita. No volver a UI antigua de main.
3. Reutilizar `src/domain/stores.ts`, `src/domain/localPreferences.ts`, `src/app/screens/LocalSettingsScreens.tsx`, `src/app/screens/PriceWorkspace.tsx`, `src/domain/priceObservations.ts`, `src/app/usePriceObservations.ts`, `src/app/ShoppingApp.tsx` y los dominios de listas/menús. Las favoritas guardadas y el almacén `jjcompraintelwgiemt.price-observations.v1` no deben corromperse ni perderse.
4. Revisar PRs #3, #4, #5, #7 y cambios en paralelo antes de codificar; **un PR técnico propio** vinculado al issue #6. No fusionar PRs existentes ni tocar producción. No migraciones destructivas, servicios nuevos de pago, login, backend ni feed externo sin permiso.

## Fase implementable ahora (una entrega demostrable y honesta)
### Módulo de catálogo y tienda
- Directorio de cadenas con IDs estables: Lidl, ALDI, HiperDino, SuperDino, HiperDino Express, Mercadona. Conservar también IDs previos como Carrefour/Otra tienda sin perder favoritos. «Mercado» local (Agromercado Adeje) es candidato separado, no tratarlo como Mercadona ni como una cadena con checkout.
- Identidad de `store`: `chainId`, `format` (hiper/super/express), `storeId?`, `name`, `postalCode?`, `priceRegion?`, `channel` (online/fisico), `fulfilmentStoreId?`, `coverageStatus`. Nunca inferir que los códigos `/c9500/` o `/c9503/` de HiperDino identifican por sí mismos una tienda física o un tipo.
- Modelo de artículo/precio: `productKey`, `GTIN?`, `name`, `brand?`, `variant?`, `packageQuantity`, `unit`, `priceCents|null`, `chainId`, `storeId?`, `postalCode?`, `channel`, `sourceUrl?`, `sourceType` (user_manual/demo/public_observed/authorised_feed), `permissionStatus`, `observedAt?`, `validFrom?`, `validUntil?`, `loyaltyCondition?`, `availabilityStatus`, `confidence`. Proponer tipos testeables; no forzar migración de B06. Precio desconocido = null, nunca 0.
- **No extraer en automático páginas comerciales**. Para el primer prototipo usar entradas de ejemplo *sintéticas* rotuladas «DEMO» y excluidas del ranking de ofertas comerciales reales, o registros manuales curados si su uso legítimo está comprobado; no presentarlos como precio actual ni stock de sucursal. Incluir URL fuente sólo si existe y se ha validado. Sin llamadas a APIs privadas, bypass de 403, scraping, proxies evasivos ni claves en cliente. Los conectores por cadena son interfaces preparadas, NO importadores activos.
- No copiar masivamente fotos, textos ni logotipos de los supermercados sin derechos. Marcas sólo en texto por ahora.

### UX que debemos poder tocar en iPhone
- En `Mis tiendas`: una, varias, todas, ninguna, `Solo esta`; guardar selección y mantener el acceso oficial (ya existe gran parte en PR #4).
- En `Ahorro/Comparar cesta`: usar sólo tiendas elegidas. Vista «Una tienda», «Comparar», «Repartir por tiendas». Agrupar por tienda con enlaces individuales. No mostrar «comprar todo», «pagar» ni «pedido enviado».
- Para lista generada desde receta, mostrar ingredientes, equivalencias válidas y faltantes; distinguir **coste de ingredientes consumidos**, **envases enteros a comprar** y **gasto real registrado**. Por ahora es aceptable que una equivalencia irresoluble quede «Pendiente de revisar».
- Mostrar `n/N artículos con precio`, fecha/fuente, cupones no aplicados, cambios de zona, disponibilidad desconocida, precios caducados, subtotal *parcial* y «Comparación incompleta» cuando corresponde. Nunca declarar la cesta más barata si no hay cobertura comparable. Ordenar €/kg, €/L y €/ud solo con misma categoría, variedad/calidad y dimensiones compatibles. Packs se redondean a enteros para desembolso.
- ALDI y Lidl alimentación: salida oficial a ofertas/folletos/localizador + lista presencial, sin checkout alimentario supuesto. SuperDino y Express: sucursal/localizador, no asumir que el checkout genérico tiene su stock/PVP. HiperDino/Mercadona: sitio oficial externo y selección de CP allí; sin carrito prellenado prometido.
- Enlaces externos permitidos `https:` de dominios oficiales pertinentes; abrir fuera de JJ (Linking), manejar error/cancelación/retorno. No transmitir productos, dieta, dirección ni presupuesto de usuario a terceros por parámetros sin consentimiento/acuerdo específico.

### Pantallas / estados que Codex debe capturar
S0 sin tienda; S1 una tienda; S2 dos; S3 todas; S4 cesta sin precio; S5 precio antiguo; S6 etiqueta demo; S7 cupón no activado; S8 productos no comparables; S9 dos formatos Dino; S10 abrir comercio sin venta online; S11 error de enlace/offline; S12 recapitulación repartida; S13 lista desde una receta. Móviles 375, 390 y 430 CSS px + Safari iPhone real por propietario. Cuatro idiomas ES, EN, FR, DE con accesibilidad de pantalla y áreas pulsables.

## Datos públicos: referencias para navegación, NO feeds autorizados
- HiperDino: `https://www.hiperdino.es/`, categoría de ejemplo `https://www.hiperdino.es/c9500/derivados-lacteos-y-huevos/huevos.html`. Diferentes rutas `c95xx` pueden diferir en precios/surtido; no mapear códigos a establecimientos sin prueba.
- Lidl: `https://www.lidl.es/c/descubre-nuevas-ofertas-cada-semana-folletos-lidl/s10087402`, Lidl Plus Canarias `https://www.lidl.es/c/lidl-plus-en-canarias/s10089416`.
- ALDI: `https://www.aldi.es/ofertas.html`, `https://www.aldi.es/folleto.html`. Regionalizar Canarias, sin venta online en España.
- Mercadona: `https://www.mercadona.es/`, depende de CP; sin API minorista confirmada.
- Agromercado de Adeje: `https://agromercadoadeje.com/listado-de-participantes-y-precios-semanales/`, validar puesto y semana si se incorporan valores manuales.
- Mercatenerife: dataset CC Attribution `https://datos.tenerife.es/es/datos/conjuntos-de-datos/precios-diarios-de-productos-hortofruticolas-en-mercatenerife-2026-`. **No incluir sus precios mayoristas en ranking minorista**. Módulo posterior opcional independiente: antes validar recurso/API, licencia, atribución y respuesta real. No bloquear esta entrega por ello.

## Pruebas y puerta de salida
1. `npm ci`, `npm run check`, `npm run build:web`, tests e2e y WebKit existentes cuando entorno lo soporte. Registrar salidas reales y fallos. Si Chromium falla en ambiente (ProcessSingleton) NO certificar e2e como pasados; intentar otra vía de QA sin fingir.
2. Tests nuevos: persistencia tras recarga; 1/2/todas/0 tiendas; catálogo regional y formatos Dino; tipo/fecha/permiso de fuente; demos excluidas; precio vacío no suma 0; packs equivalentes; oferta condicional; cobertura parcial; URL maliciosa; retorno externo; no-online; idiomas; errores de almacenamiento; no regresión de recetas y fotos.
3. No introducir imágenes de platos incorrectas ni sustituir recursos ya vinculados. Evitar trabajos de biblioteca de recetas/fotos de otros bloques, preservar todas las claves y backups.
4. **Preview Vercel** solo tras compilar y registrar commit concreto: target `staging` en proyecto existente `jj-compra-inteligente`, conservar protección, no promover a producción. Verificar URL efectiva y pantalla de tiendas + cesta, guardar capturas. Si verificación web o Safari real pendiente, etiquetar «EN REVISIÓN», no «APROBADO».
5. Actualizar `docs/PLAN_Y_ESTADOS.md` y `docs/DECISIONES_Y_RIESGOS.md` con los resultados y enlaces PR/commit/preview. Entregar lista corta de problemas abiertos, datos aún no autorizados y checklist de prueba iPhone.

## Definición de terminado
Se demuestra un recorrido real *de interfaz* Receta → Lista → Tiendas → Comparación por cobertura → Abrir fuente oficial, con datos sintéticos inequívocamente rotulados; selección persistente; cuatro idiomas; 0 pagos internos, 0 carritos fingidos, 0 scraping; pruebas documentadas y vista staging reproducible. No declarar que existe una integración comercial ni que todos los artículos tienen precio.

## Instrucción de ejecución a Codex
**Primera acción:** audita la diferencia entre PR #4 y PR #7 y escribe plan de cambios en el PR técnico; procede con el bloque de código autorizado (este encargo), sin ampliar a importadores comerciales ni al módulo mayorista. Deja el resultado en un PR independiente y, si las verificaciones permiten publicar, una preview Vercel `staging` con su commit; señala claramente cualquier bloqueo.
