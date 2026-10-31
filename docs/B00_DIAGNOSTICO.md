# B00 | Diagnóstico de la base existente

**Fecha de registro:** 2026-10-29 20:43:46 UTC  
**Origen:** informe de auditoría entregado en conversación y aceptado para continuar mediante «Sigue».  
**Alcance de B00:** lectura, comprobaciones sin emisión y diagnóstico; sin cambios, instalaciones o commits durante la auditoría.

## Inventario y arquitectura

Se examinaron 18 archivos propios en `/workspace/jjcompraintelwgiemt`, las configuraciones, el código, las pruebas y el kit completo. La base usa Expo **58.0.21**, React Native **0.88.1**, React **19.3.0**, TypeScript **6.0.3**, AsyncStorage, Manrope, Lucide/SVG, Vitest y Playwright.

`App.tsx` coordina estado, navegación y operaciones; `src/screens.tsx` contiene Inicio, detalle de comparación y formulario; `src/components/` aporta controles y modales; `src/domain/` separa cálculos/validación; `src/storage/` contiene persistencia versionada; `tests/` contiene unitarias y recorridos web.

No hay repositorio Git operativo en la carpeta y el conector GitHub devolvió **cero repositorios accesibles**. No pudieron comprobarse propietario, visibilidad, remoto, ramas, historial, commits o PRs. Esta limitación impide completar trazabilidad, no la inspección del código local.

## Qué existe

Comparaciones manuales del mismo producto entre tiendas; creación, renombrado y eliminación de comparaciones; alta/edición/borrado de ofertas; búsqueda local; precio más envío en céntimos enteros; orden ascendente; identificación de empates; enlaces externos; confirmación de eliminaciones y mensajes de error. Los datos se guardan localmente y la interfaz expone un cambio solo después de escribirlo. Si la escritura falla, se conserva el formulario.

Las búsquedas con ChatGPT se realizan fuera de la aplicación. No hay backend, autenticación, sincronización, pagos ni integración de IA.

## Evidencia técnica de B00

Se ejecutaron con resultado correcto:

```sh
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/vitest/vitest.mjs run --configLoader native --no-cache
```

TypeScript terminó con código 0 y **50 pruebas unitarias** de dos archivos pasaron. Se compararon archivos antes y después: sin archivos creados, modificados o eliminados por estas comprobaciones. Las pruebas de almacenamiento usan un simulador.

Los seis recorridos previstos de Playwright aún no se han validado completos. Se configuran Chromium escritorio y móvil emulado, no WebKit ni iPhone real. Existe una exportación web y una captura previa de escritorio; no equivalen a ejecución nativa. No se dispone de validación completa de VoiceOver, Dynamic Type, teclado iOS o teléfonos físicos.

## Diseño actual

La paleta verde y las superficies claras son reutilizables, pero la marca convive como `jjcompraintelwgiemt`, `jjcompra.` y JJ Compra Inteligente. El icono de bolsa actual no es una firma JJ. Hay texto de marca de 6 unidades, etiquetas de 8–10 y ayudas de 11–12.

El texto secundario `#6F7D73` presenta aproximadamente **4,09:1** sobre `#F8F9F5` y **3,73:1** sobre `#EAF0E6`, por debajo de AA para texto normal. La portada promocional ocupa espacio antes del contenido operativo y requiere revisión en iPhone pequeño.

Las maquetas A/B/C del kit son antecedentes de asistente, ahorro y cocina. No sustituyen las tres identidades comparables de B01. Sus importes ficticios no deben reutilizarse como precios verificados.

## Diferencia frente a Fase 2

El comparador actual no es todavía la lista de supermercado de Tenerife descrita en el kit. Faltan cantidades/unidades de lista, marcado de compra, presupuesto, menús, recetas y las cinco vistas propuestas. El comparador no cumple B06: faltan fecha, fuente explícita, formato y precio por unidad.

## Riesgos técnicos

- Salir del formulario sin guardar pierde el contenido, sin borrador ni confirmación de descarte.
- Un registro corrupto bloquea la carga completa; se preservan datos, pero no hay recuperación parcial o exportación.
- La validación interpreta la URL, pero se guarda y abre el texto original; conviene probar normalización y apertura nativa.
- El estado y las pantallas están concentrados en pocos archivos. La evolución puede ser gradual, sin reescritura.
- Faltan CI, regresión visual y validación de accesibilidad. La ausencia de `ios/` y `android/` es normal en Expo administrado.
- La búsqueda limitada de secretos en código propio no encontró coincidencias; no constituye una auditoría completa de seguridad de dependencias.

## Reusar / mejorar / investigar / descartar

| Módulo | Recomendación |
|---|---|
| Expo, React Native y TypeScript | Reusar; no hay motivo identificado para reconstruir. |
| Cálculos, empates y ordenación | Reusar conservando pruebas. |
| Persistencia local | Reusar y ampliar solo al aprobar nuevos datos/migración. |
| Pantallas, tema y componentes | Mejorar tras elegir identidad B01. |
| Navegación | Investigar evolución para cinco vistas, después de aprobación UX. |
| Trabajo actual | No descartar ningún módulo ahora. |

## Continuidad aprobada

El propietario autorizó empezar B01 mediante «Sigue». La prioridad es presentar **V1 Verde Esencial, V2 Verde Noche y V3 Verde Mercado**, con el mismo contenido, monogramas JJ y pantallas completas de iPhone: Inicio, Mi compra vacía y Mi compra poblada. Ninguna identidad está aprobada. B02 permanece pendiente de selección explícita.

No se incorporan funciones, bases de datos, integraciones o pagos en B01. No hay commit/PR, por la limitación Git indicada.
