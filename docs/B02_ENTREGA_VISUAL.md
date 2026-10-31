# B02 · Entrega de pantallas y experiencia

**Estado: EN REVISIÓN. B03 no iniciado.** El «Sigue» del propietario autoriza B02 sobre Verde Mercado y M3 provisional. El logo definitivo continúa diferido.

## Evidencia para revisar con ChatGPT

- [PDF de siete páginas](../design/b02/evidence/B02-diseno.pdf).
- [Inicio, Mi compra y Ahorro](../design/b02/evidence/B02-pantallas.png).
- [Menús, Perfil y receta](../design/b02/evidence/B02-secundarias.png).
- [Mapa de navegación, F1–F5 y componentes](B02_FLUJOS_Y_COMPONENTES.md).
- [Checklist y registro de validación](B02_CHECKLIST_USABILIDAD.md).
- [Ejecución y reproducción](../design/b02/README.md).

## Qué se entrega

| Vista | Resultado de diseño |
|---|---|
| Inicio | Entrada rápida, presupuesto separado de gasto y estimación, acción para crear/continuar compra y acceso a un menú de ejemplo. |
| Mi compra | Cantidad/unidad, selección, progreso, precios ausentes, acción fija de añadir y propuesta de deshacer. |
| Ahorro | Presupuesto y total conocido diferenciados; alternativa útil sin fuentes, observación antigua fechada y productos no comparables. |
| Menús | Semana de ejemplo, personas/tiempo, receta e ingredientes con revisión antes de confirmar. |
| Perfil/Hogar | Uso sin cuenta, ajustes, privacidad, accesibilidad y uso compartido representado únicamente como plan posterior. |

La navegación mantiene cuatro pestañas y Perfil desde el avatar. Las hojas cubren producto, revisión, receta, presupuesto, hogar, accesibilidad y privacidad. Los componentes comunes están en `design/b02/ui.tsx`; la arquitectura y el contrato de datos de la aplicación existente permanecen intactos.

Se han representado los ocho estados del bloque: vacío, carga, offline, micro denegado, error, lista de 20 productos, precios ausentes y presupuesto excedido. También se incluyen precio antiguo y formatos no comparables. Todos muestran datos de ejemplo y una salida o siguiente acción.

## Clasificación del resultado

- **Maquetas ejecutables:** pantallas que pueden renderizarse para revisión y comparación de estados.
- **Navegación de muestra:** pestañas, hojas y correcciones temporales de ejemplos. No equivale a un producto con listas nuevas persistentes.
- **Aplicación real existente:** el comparador manual de fase 1, conservado sin cambios. No se integra todavía el nuevo diseño en su entrada ni se reemplaza su almacenamiento.
- **Pendiente:** aprobación de B02, ejecución y validación móvil de B03 y funcionalidades de B04 en adelante.

Las búsquedas continúan en ChatGPT externo. La entrada de texto enseña una revisión prefijada y no interpreta peticiones ni llama a una API. Los menús no calculan costes sin fuente. No se activan cuentas, invitaciones, sincronización o pagos.

## Comprobaciones

La evidencia reproducible se registra en `design/b02/evidence/verification.json`, `contrast.json` y `preservation.json`. La captura recorre 19 escenas a tres tamaños y dos simulaciones de texto al 130 %. Hay además imágenes de la revisión y de la lista al final del desplazamiento.

Los recorridos comprueban F1 (vacío/formulario/validación), F2 (receta/revisión/exclusión/cancelación), F3 (texto externo/corrección/vuelta al borrador/cancelación), F4 (sin precios/vuelta a lista) y F5 (plan de hogar/cierre). Comprueban también el último producto de la lista de 20 artículos y que no se escriban datos en almacenamiento local.

Se corrigieron dos problemas detectados durante la revisión: estados ARIA de selección no expuestos por React Native Web y recorte interno del resumen presupuestario con texto ampliado. Las comprobaciones horizontales incluyen los límites de texto visible, además del ancho del documento.

Comandos principales:

```sh
# Raíz: TypeScript y regresión del dominio/almacenamiento existentes
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/vitest/vitest.mjs run --configLoader native --no-cache

# design/b02: exportación, contraste y evidencia visual
npm run typecheck
npm run export:web
node check-contrast.cjs
node capture.cjs
```

## Límites y revisión pendiente

Las capturas son **web a escala iPhone**, no iOS nativo. Dynamic Type, teclado del sistema, safe areas físicas, VoiceOver/TalkBack y uso con una mano siguen pendientes de prueba en dispositivo o simulador. La ampliación de texto web es una comprobación de apoyo, no sustituye esas pruebas.

No se añadieron dependencias ni servicios. Se reutilizan Manrope, Lucide, SVG e ilustraciones de B01. M3 no se rediseña ni se considera definitivo.

Los archivos nuevos se encuentran en `design/b02/` y la documentación B02. Solo se actualizan los registros de plan y decisiones. Se conservan los archivos y evidencias anteriores. No hay commit/PR porque sigue faltando un repositorio Git operativo.

**Próxima puerta:** revisión de las cinco vistas, flujos y estados por ChatGPT y el propietario; aprobación o ajustes concretos antes de B03. La revisión del logo queda para más adelante, según la decisión vigente.


## Resultado registrado — 2026-10-29 23:05:51 UTC

- 59 comprobaciones de vista correctas: sin errores JavaScript, sin recortes horizontales de texto visible y sin escrituras locales.
- 5 acciones de navegación y 6 recorridos (F1–F5 más lista de20 productos) correctos.
- 32 controles de contraste correctos:31 de texto y1 borde de campo. TypeScript y50 pruebas unitarias existentes aprobados.
- 61 capturas de pantallas y2 láminas; PDF de7 páginas. Texto ampliado130% en Inicio y Mi compra.
- 67 archivos previos y33 evidencias B01 conservados; solo se actualizan PLAN_Y_ESTADOS y DECISIONES_Y_RIESGOS.
- B02 queda EN REVISIÓN. No se inicia B03 ni se afirma validación iOS nativa.
