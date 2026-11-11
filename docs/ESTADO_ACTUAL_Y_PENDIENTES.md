# Estado vigente de construcción

Actualizado el 11 de noviembre de 2026. Este inventario distingue código construido, comprobación técnica, aceptación visual y funciones condicionadas. Las auditorías y entregas fechadas anteriores se conservan como historial.

## Funciones locales construidas

- Bienvenida, idioma del dispositivo y elección manual persistente en español, inglés, alemán y francés; formatos locales y compras en euros.
- Cuatro pestañas y las 16 vistas de preparación V2. Los nueve estados de la galería se identifican como ejemplos; no representan servicios o permisos activados.
- Listas, productos, cantidades y unidades, categorías, revisión de duplicados, presupuestos y deshacer. Guardado con protección frente a datos corruptos, conflictos y resultados inciertos.
- Búsqueda entre productos guardados y ficha local. Voz/cámara opcionales en navegadores compatibles tras consentimiento y gesto; alternativa manual y limpieza de recursos.
- Menús de cinco cenas, siete recetas iniciales, personas, sustitución, filtros y revisión de ingredientes antes de añadir.
- Gastos confirmados introducidos por la persona e historial, separados de estimaciones y productos marcados.
- Comparador manual de formatos equivalentes con tienda, fecha, fuente y cobertura explícitas; sin precios comerciales importados.
- Preferencias y avisos internos locales, exportación JSON y borrado independiente por categoría con confirmación. No hay restauración automática de backups.
- Selección de una, varias o todas las seis tiendas del piloto, conservando favoritas anteriores. Enlaces oficiales separados por formato, sin transmitir listas ni carritos. Compra y pago en el comercio externo.
- Compartir una copia revisada de una lista en texto: pendientes por defecto, opción de incluir comprados, sin notas, precios, presupuesto ni identificadores. Web Share o descarga TXT explícita; panel nativo preparado sin afirmar recepción. No sincroniza hogares.

## Bloques del kit

| Bloque | Construcción actual | Criterio de cierre pendiente |
|---|---|---|
| B00 · Auditoría | Repositorio y seis paquetes originales recuperados y contrastados; historia conservada. | Mantener trazabilidad al integrar nuevas entregas. |
| B01 · Identidad | Dirección V2, paleta y raster oficial exacto; lámina técnica aislada de seis tamaños y fondos. | SVG fiel, transparencia, isotipo, iconos, variantes y propuesta 3D por etapas. No se modifica ni sustituye el original sin aprobación. |
| B02 · UX | Pantallas locales y componentes con cuatro idiomas y estados; referencia canónica conservada. | Aceptación estética del propietario/ChatGPT y contraste/usabilidad completos en dispositivo. |
| B03 · Prototipo iPhone | App Expo y exportaciones web/iOS/Android; navegador a varios tamaños y motor WebKit. | Instalación/ejecución física, teclado, zonas seguras, gestos, Safari y lectores nativos. Exportar no acredita este criterio. |
| B04 · Listas y presupuesto | Funciones locales, revisión y persistencia construidas; compartir texto añadido. | Aceptación física y uso real con listas del piloto. |
| B05 · Menús | Motor local, filtros, cantidades y revisión construidos; búsquedas con ChatGPT fuera de JJ. | Recibir las 150 recetas traducidas e implementar su colección persistente con validación. No se inventa su contenido. |
| B06 · Comparador | Observaciones y comparación manual; selección de tiendas y salida externa construidas. | Fuentes comerciales autorizadas/localizadas antes de importar precios o afirmar ahorro/stock. |
| B07 · Cuentas y hogares | Copia manual compartible y privacidad local disponibles. | Cuentas, invitaciones, revocación, sincronización, migración y aislamiento real entre hogares no implementados. Requieren esquema y costes aprobados. |
| B08 · QA y piloto | Suites estáticas, unitarias y de navegador; auditoría después de parejas y previews verificadas. | Piloto físico, accesibilidad nativa, distribución y feedback de personas. Cinco avisos moderados de herramientas siguen abiertos. |
| B09 · Comercio | Salida a páginas oficiales sin datos de lista ni pago dentro de JJ. | Acuerdos, cobertura, derechos de datos y responsabilidades antes de otras integraciones. No hay pedidos, stock ni pagos procesados por JJ. |

## Verificación de la entrega de tiendas y compartir

TypeScript y 816 pruebas unitarias correctos. Exportaciones web/iOS/Android completadas. La matriz final de navegador, publicación y sus resultados se documentan en [la auditoría de esta pareja](TIENDAS_COMPARTIR_Y_AUDITORIA.md). La construcción de estas funciones no cierra automáticamente los criterios físicos, visuales o comerciales de la tabla.

## Lo que todavía requiere trabajo de construcción

1. Completar las etapas de recursos de marca con revisión y aprobación de las propuestas; la lámina del raster original no es un SVG ni un icono nuevo.
2. Incorporar las recetas del propietario cuando se reciban, con biblioteca persistente, identificación estable y controles de copia/borrado propios.
3. Preparar y aprobar la arquitectura de cuentas/hogares, y después implementar y probar los permisos y la sincronización. Compartir texto no sustituye ese trabajo.
4. Completar distribución y validación física con feedback real. No se publica un resultado de piloto sin ejecutarlo.
5. Incorporar datos de comercios únicamente cuando existan fuentes y permisos adecuados; las páginas oficiales abiertas no constituyen un feed autorizado.

No se presenta la aplicación ni B00–B09 como terminados por disponer de una preview o por superar las pruebas de los recorridos existentes.
