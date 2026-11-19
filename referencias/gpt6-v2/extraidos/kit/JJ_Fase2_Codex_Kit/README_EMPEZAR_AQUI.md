# JJ COMPRA INTELIGENTE | KIT DE DIRECCIÓN FASE 2
**Versión:** 1.0  |  **Fecha:** 29-10-2026  |  **Mercado:** Tenerife, Canarias
**Responsabilidades:** propietario = decisiones/aprobaciones; ChatGPT = producto, UX, especificación y revisión; Codex = toda la programación.

## Cómo usar este kit
1. Abrir Codex **Cloud** con el entorno que tenga asociado el repositorio correcto de GitHub.
2. Adjuntar este kit o copiar su contenido al repositorio **solo después de que Codex lo haya inspeccionado**. Si ya existen archivos con estos nombres, Codex debe proponer una combinación sin sobreescribir documentos.
3. Pegar `PRIMER_MENSAJE_PARA_CODEX.md` como la primera tarea. Esa tarea es **solo de auditoría**, sin cambios de código.
4. Revisar el informe de auditoría. No iniciar los bloques visuales sin entender el estado del repositorio.
5. Ejecutar un único bloque por tarea/PR, según el orden y la puerta de aprobación del archivo `docs/PLAN_Y_ESTADOS.md`.
6. Para el diseño, Codex debe presentar alternativas, pantallas en estados reales, capturas del iPhone y propuesta de navegación. **Pedir aprobación del propietario antes de desarrollar la lógica.**
7. Guardar cada decisión y resultado en el repositorio. No depender de conversaciones temporales para la continuidad.

## Documentación principal
- `AGENTS.md`: reglas persistentes para Codex (plantilla; no sustituir las instrucciones actuales del repo sin revisar).
- `docs/PRODUCTO_Y_ALCANCE.md`: visión, funciones, fases y límites de mercado.
- `docs/DIRECCION_VISUAL.md`: identidad verde y tres rutas de diseño.
- `docs/PANTALLAS_Y_FLUJOS.md`: especificación de pantallas, estados y microinteracciones.
- `docs/PLAN_Y_ESTADOS.md`: tablero único de bloques, dependencias y aprobaciones.
- `docs/DECISIONES_Y_RIESGOS.md`: fuente de verdad de acuerdos, propuestas y preguntas abiertas.
- `docs/CHECKLIST_CALIDAD.md`: criterios de aceptación de diseño/seguridad/funcionamiento.
- `bloques/B00_AUDITORIA.md` ... `bloques/B09_COMERCIO.md`: encargos unitarios listos para Codex.

## Reglas no negociables
- **Nunca perder trabajo existente:** primero inventario, después cambios pequeños y reversibles.
- **Visual primero:** no convertir wireframes de baja fidelidad en interfaz de producción sin revisión.
- **Aplicación móvil:** iPhone como primer dispositivo de pruebas, diseño adaptable a Android.
- **Bajo coste:** preferir herramientas gratuitas y aprovechar lo que ya exista. Avisar antes de cualquier gasto o servicio de pago.
- **Veracidad:** no fingir precios, stock, descuentos, acuerdos con comercios o pagos reales.
- **Privacidad por diseño:** proteger hogares/listas. No incrustar claves secretas en frontend.
- **Objetivo Fase 2:** producto de planificación y ahorro utilizable sin integración comercial; **checkout integrado solo cuando exista autorización**.

## Pendiente de acceso
Al preparar el kit, la conexión GitHub de esta conversación mostraba **0 repositorios accesibles**. El kit no se ha instalado en el repo ni se ha enviado a Codex. La tarea inicial permitirá descubrir la ruta exacta y documentar el estado técnico.

## Material conservado de la fase previa
En `referencias/` se incluyen copias del estudio PDF, las tres maquetas de interfaz y el brief de Codex anteriores. **Son antecedentes, no una orden de replicar su aspecto literalmente.** El diseño será refinado y elegido mediante B01 y B02. Las suposiciones de mercado y las cifras no verificadas del informe deben revisarse si se usan para decisiones futuras.
