# Especificación UX de pantallas y flujos
**Estado:** borrador para aprobación visual. No es una implementación.

## Navegación candidata
Tabs persistentes: `Inicio` · `Mi compra` · `Ahorro` · `Menús`. Avatar superior a `Perfil`. Mostrar siempre estado de pestaña y respetar zonas seguras del teléfono. No mezclar «Lista» y «Mi compra» como dos módulos separados.

## P01 Inicio | Pantalla estrella
**Orden vertical:** saludo breve y perfil > barra de acción «¿Qué necesitas comprar?» con texto + micro > resumen semanal (presupuesto asignado, gasto real, estimación y sin precio) > CTA «Continuar mi lista» > un contenido útil contextual (menú pendiente o productos habituales) > navegación inferior.
**Acción principal:** iniciar/continuar lista. **Secundarias:** dictar, crear menú.
**Estados:** primera visita, lista activa, sin presupuesto, sin red, permisos negados, carga.
**Microcopy ejemplo:** «Añade productos por voz o por escrito»; nunca «ahorraste 17 €» si no hay evidencia.

## P02 Mi compra | Lista en supermercado
Encabezado nombre/ubicación opcional + fecha; progreso comprado/pendiente; presupuesto visible, claro y no alarmista; filas con selección, producto, cantidad, unidad, nota y precio solo si verificable/introducido; edición accesible; añadir; deshacer acciones destructivas. Orden por categorías configurable o manual. Gasto real y estimación separados.
**Estados:** vacía, 20+ artículos, producto duplicado, cambio de cantidad, offline, cambios de hogar, precio ausente.
**Tarea crítica:** añadir 10 ítems, cerrar, reabrir, persistir y marcar comprados.

## P03 Ahorro | Datos honestos
Tarjeta resumen presupuestario, filtros de tienda/zona, productos comparables por marca+formato+unidad y fecha de observación; «Sin datos suficientes» cuando corresponda; alertas de antigüedad; vista de mejor precio por unidad y total por cesta SOLO si los artículos son equiparables y existe fuente.
**Estados:** sin acuerdos, sin datos, muestra verificada, fuentes antiguas, productos no equiparables, cesta con incomparables.
**Jamás:** inventar ahorros o inventarios. Si es demo, mostrar «Datos de demostración» en toda la vista.

## P04 Menús | Planificación simple
Vista semanal; seleccionar personas, presupuesto orientativo, tiempo, preferencias y exclusiones; tarjetas con receta (nombre, tiempo, raciones, coste solo si sustentado); detalle con ingredientes; revisión antes de añadir a lista (deduplicación, unidad y cantidad ajustables).
**Estados:** sin menú, menú generado, ingrediente sustituido, receta incompatible, IA no disponible, ingredientes ya existentes.
**Cuidado:** dietas, alergias, etiquetado e ingredientes deben confirmarse por el usuario; la app no sustituye consejo médico.

## P05 Perfil/Hogar
Cuenta opcional donde técnicamente sea viable; idioma; ajustes de notificaciones; miembros del hogar si sincronización activada; tiendas favoritas; presupuesto; accesibilidad, política de privacidad, exportación/borrado de datos, ayuda. Evitar que el onboarding pida demasiada información antes de probar lista local.

## Flujo F1 | Primera compra sin registro
Abrir > tocar Crear lista > añadir «leche, pan, huevos» > establecer cantidades sugeridas o confirmarlas > editar un producto > marcar comprado > cerrar/reabrir > lista recuperada. Debe funcionar sin conexión.

## Flujo F2 | Menú a lista
Menús > elegir «5 cenas para 2 personas» > revisar platos > abrir receta > añadir ingredientes > revisar elementos ya existentes, unidades y cantidades > confirmar > Mi compra actualizada.

## Flujo F3 | Lenguaje natural
En Inicio escribir «necesito leche, dos barras de pan y huevos» > interpretación en vista de revisión > confirmar o corregir > insertar en lista. **Nunca** editar el carrito silenciosamente.

## Flujo F4 | Comparar con honestidad
Mi compra > Ahorro > mostrar total conocido e ítems sin precio > elegir tienda > si no hay datos, explicar y ofrecer lista presencial > cuando hay fuente, comparar por formato y fecha. Ningún pago real durante Fase 2.

## Flujo F5 | Uso compartido (fase posterior a lista local)
Crear hogar > invitar segundo usuario > sincronizar lista con permisos > resolver conflictos > revocar acceso > verificar aislamiento de hogares.

## Diseño de contenido y privacidad
- Idioma inicial español, precios € y convenciones locales.
- Ejemplos de alimentos normales y recetas cotidianas/canarias, no marcas inventadas.
- Si hay fotos, informar derechos y fuentes cuando corresponda.
- La IA nunca confirma precio ni stock por sí misma.
