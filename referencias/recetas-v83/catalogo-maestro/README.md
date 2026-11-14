# Índice maestro · datos públicos autorizados

El [índice de 150 identidades](INDICE_PUBLICO_150.json) se deriva **únicamente del ZIP público previamente autorizado**, cuyo SHA-256 está fijado. Para las 120 recetas seleccionadas usa campos permitidos de esa fuente. Las 30 identidades reservadas repiten exactamente ID, posición, motivo y hash ya presentes en su `PROVENIENCIA.json`; no incorporan nuevos estados editoriales ni evidencias de la auditoría privada.

El [control público de 15 lotes](CONTROL_LOTES_15.json) distingue las 120 fichas públicas en cinco idiomas de las identidades reservadas. No publica controles nuevos de las retenidas. La app conserva 120 V83 + 7 anteriores = 127; no se activa contenido por generar este índice.

El registro completo de 150 recetas/750 fichas, la revisión privada por lotes y la propuesta de conciliación permanecen fuera de GitHub/Vercel. La herramienta [audit-recipes-v83.py](../../../scripts/audit-recipes-v83.py) exige un destino privado nuevo ajeno al repositorio, permisos 0700/0600 yno sobrescritura; `--check` compara sin escribir. Las pruebas utilizan datos sintéticos públicos, sin depender del original privado.

[Alcance y resultados técnicos](../../../docs/MAESTRO/BLOQUE03_CATALOGO_Y_CONCILIACION.md). La frontera pública fue restringida tras el rechazo automático a publicar nuevos estados de retenidas fuera de la autorización existente; el detalle se conserva para revisión privada del propietario.
