# Tablero maestro y control del trabajo | JJ Compra Inteligente
**Estado al crear este kit:** documentación preparada **fuera del repositorio**. Ninguna tarea ejecutada en Codex. GitHub no accesible desde esta conversación (0 repositorios visibles).

## Leyenda
`PENDIENTE` sin comenzar | `EN CURSO` Codex está trabajando | `EN REVISIÓN` evidencia entregada | `APROBADO` usuario aprueba + criterios cumplidos | `BLOQUEADO` falta dependencia. Solo actualizar estado con pruebas y fecha.

| Bloque | Nombre | Dependencia | Estado | Puerta de aprobación |
|---|---|---|---|---|
| B00 | Auditoría repo | acceso GitHub/Codex | BLOQUEADO | diagnóstico aceptado |
| B01 | Identidad visual | B00 | PENDIENTE | elegir V1/V2/V3 y logotipo |
| B02 | Arquitectura UX de pantallas | B01 | PENDIENTE | revisar flujos y vistas |
| B03 | Prototipo visual en iPhone | B02 | PENDIENTE | capturas + prueba de uso aprobadas |
| B04 | Listas y presupuesto | B03 | PENDIENTE | funcionalidades y persistencia validadas |
| B05 | Menús, recetas e IA | B04 | PENDIENTE | precisión + confirmación validadas |
| B06 | Comparador de precios | B04 | PENDIENTE | fuentes legítimas + transparencia |
| B07 | Cuentas y hogares | B04 | PENDIENTE | privacidad, RLS y sincronización |
| B08 | QA y piloto Tenerife | B04–B07 | PENDIENTE | reportes + testers |
| B09 | Comercio real integrado | acuerdos y B08 | BLOQUEADO | autorización comercial + checkout |

## Gestión obligatoria por bloque
- **Objetivo:** una frase de resultado observable.
- **Entradas:** archivos y decisiones aprobadas.
- **Trabajo:** tareas concretas, sin ampliar alcance.
- **Evidencia:** enlaces, screenshots, comandos y pruebas reales.
- **Criterios de aceptación:** checklist verificable.
- **Decisión:** Aprobado / Repetir / Bloqueado + quién y fecha.
- **Siguiente:** exactamente el siguiente bloque autorizable.

## Control de cambios
- Si surge una idea nueva: añadir a `DECISIONES_Y_RIESGOS.md` con estado **propuesta** y revisar prioridad; no asumir aprobación.
- Cualquier cambio de alcance requiere descripción de impacto en tiempo, coste, datos y UX.
- No declarar «funciona» sin prueba; no declarar «subido a GitHub» sin commit/PR visible.
- Al crear una nueva conversación, compartir este tablero y el último PR/commit. No reconstruir el plan desde memoria.

## Mini bitácora (rellena Codex una vez empiece)
| Fecha UTC | Bloque | Cambio/verificación | PR/commit | Resultado | Próximo paso |
|---|---|---|---|---|---|
| 2026-10-29 | Documentación | Kit de trabajo y dirección visual preparado localmente fuera de repo | ninguno | listo para importar | obtener repo y lanzar B00 |
