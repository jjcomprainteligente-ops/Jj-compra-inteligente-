# JJ Compra Inteligente | Brief técnico Fase 2
**Fecha:** 29 octubre 2026  
**Mercado piloto:** Tenerife, Islas Canarias  
**Marca:** JJ Compra Inteligente  
**Color principal:** verde `#167347`, verde oscuro `#133D2D`, verde pálido `#EDF7EF`.

## Visión del producto
La app ayuda a planificar compras y menús, organizar un hogar y controlar presupuesto. Debe funcionar sin acuerdo con ningún supermercado. La compra integrada con pagos reales es un objetivo de Fase 3, condicionado a APIs/acuerdos.

## Instrucciones de trabajo para Codex
1. **Inspecciona el repositorio y su historial antes de editar.** Determina framework, dependencias, scripts, rama principal, configuraciones de CI y estado real. No asumas que el repositorio está vacío.
2. Presenta un diagnóstico y un plan de PRs pequeños. Mantén el proyecto existente si es recuperable; no hagas reemplazos destructivos.
3. Implementa diseño **mobile first** para iPhone y Android. Si el proyecto no contiene base técnica válida, propón **Expo + React Native + TypeScript** y espera confirmación antes de una migración destructiva.
4. No metas secretos en cliente. Variables públicas solo donde esté permitido. Supabase con RLS, políticas de acceso por hogar e índices adecuados.
5. IA solo por backend con respuestas estructuradas validadas; nunca usar la IA como fuente de precios o inventario.
6. Prueba los cambios y documenta el resultado real (éxitos y errores). No simules pedidos ni pagos reales como funcionales.

## Pantallas objetivo
- **Inicio:** bienvenida, añadir por texto/voz, resumen de presupuesto y accesos a lista/menú.
- **Mi compra:** lista compartible, añadir, cambiar cantidad/unidad, marcar comprado, historial y exportar.
- **Menús:** recetas sencillas, porciones, tiempo, restricciones y convertir ingredientes a lista.
- **Ahorro:** comparación por kg/l/unidad **solo con datos fechados**, muestra de tienda, fecha de actualización, total estimado y coste real si existe.
- **Perfil/hogar:** miembros, presupuestos, tiendas favoritas, privacidad, eliminación de cuenta.

## Flujo mínimo MVP
Usuario abre app -> crea una lista sin registrarse -> escribe «leche, huevos y arroz» -> confirma cantidades -> marca comprados -> guarda lista. Opcionalmente crea un menú e incorpora ingredientes. El resumen del gasto debe distinguir producto sin precio de producto con precio verificado.

## Modelo de datos inicial (propuesta adaptable)
`profiles, households, household_members, shopping_lists, list_items, products, product_variants, retailers, stores, price_observations, recipes, recipe_ingredients, meal_plans, consents`.

Campos imprescindibles por observación de precio: `store_id`, `product_variant_id`, `price`, `currency`, `quantity`, `unit`, `unit_price`, `observed_at`, `source`, `verification_method`.

## Plan de entregas, por PR
- [ ] **PR1** Auditoría y README del repositorio actual. Añadir documentación de arquitectura y matriz de decisiones.
- [ ] **PR2** Sistema visual JJ (paleta, tipografía, navegación, componentes de formulario, estados vacíos y accesibilidad).
- [ ] **PR3** Lista de compra local persistente, con pruebas de ediciones/cantidades.
- [ ] **PR4** Integración Supabase opcional: autenticación y sincronización segura de hogar/listas.
- [ ] **PR5** Recetas y generador determinista de lista de ingredientes, con corrección de equivalencias.
- [ ] **PR6** Asistente IA para interpretar lenguaje natural y confirmar antes de escribir en la lista. Validación con esquemas y límites de coste.
- [ ] **PR7** Comparación piloto de precios: carga manual/permitida, fecha, fuente y coste por unidad. Sin scraping no autorizado.
- [ ] **PR8** Analítica respetuosa con privacidad, pruebas end-to-end en iPhone, feedback de testers.

## Criterios mínimos de aceptación
- Navegación funcional en dispositivo móvil sin errores.
- Usuario crea una lista con >= 10 ítems, modifica cantidades, cierra/reabre app y persisten.
- Asistente no cambia presupuesto o ítems sin confirmación.
- Ningún precio sin fecha aparece como «actual».
- No se afirma disponibilidad de stock si no existe feed autorizado.
- Perfiles privados y hogares inaccesibles para otros usuarios según políticas RLS.
- Responde correctamente a permisos negados, sin conexión, IA caída y tienda no asociada.
- Compras reales deshabilitadas hasta acuerdos y checkout seguro.

## Riesgos y dependencias
- **Integraciones de comercios:** su presencia online no implica API pública ni autorización de cesta/checkout.
- **Legal:** aplicar RGPD desde diseño, términos, privacidad y obligaciones de contratación si JJ vende directamente.
- **Costes:** GitHub, Expo y Supabase pueden estar en planes gratis dentro de cuotas; consumo de IA, publicación y acuerdos comerciales no son necesariamente gratis.
- **Datos:** comparación requiere productos equivalentes, tamaño, fecha, tienda y una procedencia legítima.

## Métricas piloto
- Activación: % de usuarios que crean lista de 3+ ítems.
- Retención: % que vuelve a usar listas en segunda semana.
- Utilidad: minutos necesarios para completar una lista estándar.
- Confianza: errores de producto/precio y correcciones por usuario.
- Producto: % de usuarios que convierten una receta en ítems de compra.

## Preguntas que deben resolverse antes de abrir Fase 3
1. ¿Qué retailer dispone de acuerdo y autorización técnica?
2. ¿Quién vende, cobra, entrega y devuelve la compra?
3. ¿Con qué frecuencia se actualizan precios/stock y quién responde por un error?
4. ¿Cuál es la tarifa del proveedor y el soporte de incidencias?

## Investigación
Consultar el informe adjunto `JJ_Compra_Inteligente_Fase_2_Estudio_y_Diseno.pdf`. Distinguir claramente hechos de Jowzi de las opiniones sobre su app hermana Jow. No atribuir rankings internos o cifras de engagement no públicas.
