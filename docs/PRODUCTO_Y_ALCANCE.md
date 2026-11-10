# Producto, visión y límites | JJ Compra Inteligente
**Versión:** 1.0 | 29-10-2026

## Visión
JJ ayuda a hogares de Tenerife a planificar comidas, transformar necesidades en listas, controlar gastos y, cuando sea posible, comparar productos de forma transparente. Debe ser útil incluso sin un supermercado integrado.

## Promesa al usuario
«Planifica, compra con criterio y controla tu presupuesto». El ahorro económico solo se publicitará si tenemos datos verificables; mientras tanto la app demuestra ahorro de tiempo y organización, sin promesas falsas.

## Perfiles prioritarios
1. Hogar con presupuesto semanal y poco tiempo.
2. Persona que compra presencialmente en diferentes establecimientos.
3. Familias o parejas que comparten una lista.
4. Usuario que cocina a partir de un menú y quiere generar ingredientes.

## Tareas esenciales (jobs to be done)
- En 30 segundos puedo iniciar una lista; sin crear cuenta si no es necesaria.
- Puedo editar unidades, cantidades, marcas opcionales y marcar productos comprados.
- Distingo mi presupuesto de gasto real/estimado y productos sin precio.
- Puedo proponer cinco cenas, ajustar personas, y añadir sus ingredientes a una lista tras revisar equivalencias.
- Entiendo si un precio tiene tienda, fecha, formato y fuente legítima. No confundo precio ejemplo con precio actual.
- Cuando un comercio no está integrado, sigo usando la lista en tienda o la comparto.

## Fase 2 MVP: sí
- Identidad visual y navegación aprobadas.
- Lista local sin obligación de registrarse, guardada entre sesiones.
- Presupuesto orientativo y gastos reales introducidos por la persona.
- Menús/recetas y generación de lista con revisión.
- Voz o lenguaje natural en segundo paso técnico, con confirmación antes de editar.
- Modo demo de ahorro sin presentar precios ficticios como comerciales.
- Preparar sincronización del hogar para cuando esté validada.

## Fase 2: no prometer
- Comparación en tiempo real donde no exista fuente autorizada.
- Stock en tienda, ahorro exacto, sincronización de carritos, delivery, pago dentro de JJ.
- Integraciones con cadenas sin su consentimiento o medios permitidos.
- Datos de salud o dieta con interpretación médica.

## Fase 3 condicionada
Acuerdos comerciales, catálogo, disponibilidad, operaciones de checkout, devoluciones, facturas, soporte de pedido y pagos. Se negociará quién vende, cobra, entrega y responde por incidencias.

## Éxito piloto (metas de validación, no datos existentes)
- Al menos 20 personas prueban los flujos base en Tenerife.
- 90% puede crear una lista de 5 productos sin ayuda en prueba moderada.
- 0 precios de demostración etiquetados como reales.
- 0 cambios en presupuesto o carrito hechos por la IA sin confirmación.
- Resultados de tiempo de tarea medidos, no inventados.

## Decisiones confirmadas
- Nombre: **JJ Compra Inteligente**.
- Localización inicial: **Tenerife**.
- Verde como color dominante.
- Desarrollador de código: **Codex**, no ChatGPT.
- Preservar el repositorio existente y minimizar costes.
- Prioridad inmediata: calidad visual y experiencia móvil.

## Propuestas por validar
- Tecnologías: Expo + React Native + TypeScript, Supabase y backend IA, solo si la auditoría avala ese camino.
- Navegación de 4 pestañas: Inicio, Mi compra, Ahorro, Menús; Perfil desde avatar.
- Concepto visual recomendado: `Verde Esencial`.

## Enmienda de alcance — 10/11/2026: compra y pago fuera de JJ
**Decisión explícita posterior del propietario, prevalece sobre redacciones de fase 3 y B09 que sugieran checkout dentro de JJ.**

JJ genera recetas, listas, presupuestos, análisis de gasto y comparaciones. La persona elige **una tienda, varias tiendas o todas**, con establecimientos específicos cuando se conozcan. **JJ no vende, cobra ni recibe pagos nunca.** La decisión y el pago se completan exclusivamente en la tienda, su app/web o en caja física. Un enlace externo no implica carrito importado, pedido confirmado o disponibilidad.

Se permite preparar un piloto con precios/ofertas públicos **solo de manera legal y transparente**, con referencias documentadas y sin scraping masivo ni APIs privadas sin autorización. Posteriormente se negociará acceso oficial a datos de producto/precio por zona y, si procede, enlaces admitidos a carritos externos. «Mercado» incluye provisionalmente Mercadona y mercados locales; la separación mayorista/minorista es obligatoria.

Especificación de producto y pruebas pendientes: [Piloto de precios y salida externa](PILOTO_PRECIOS_TENERIFE_Y_SALIDA_A_TIENDAS_2026-11-10.md). Ninguna integración minorista ni checkout se considera implementada por esta enmienda.
