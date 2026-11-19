# Quality gates | Lista para revisión

## Gate G0: repo seguro
- [ ] Identificar repo/rama y estado real. No sobrescribir trabajo.
- [ ] Documentar cómo iniciar el proyecto, lint, test, build, CI.
- [ ] Informar sobre dependencias y posibles costes.
- [ ] Plan breve de PRs y riesgos. No modificar código en la auditoría.

## Gate G1: identidad visual
- [ ] 3 propuestas visuales distintas (V1/V2/V3), misma pantalla y mismo contenido.
- [ ] Logo/monograma en icono, claro, oscuro, pequeño.
- [ ] Paleta contrastada, tipografía y componentes documentados.
- [ ] Capturas simuladas o reales correctamente etiquetadas.
- [ ] Aprobación explícita del usuario antes de consolidar.

## Gate G2: pantallas + experiencia
- [ ] Inicio, Mi compra, Ahorro, Menús y Perfil.
- [ ] Acción principal clara y navegación consistente.
- [ ] Estados: vacío, cargando, error, offline, sin permisos, sin datos de precio, presupuesto excedido.
- [ ] Validación con tamaño de letra grande, VoiceOver/TalkBack y contraste AA.
- [ ] Sin precios falsos sin etiquetado de demo, sin carritos reales simulados.
- [ ] Capturas en iPhone pequeño y grande, no solo imágenes de presentación.

## Gate G3: funcionalidad esencial
- [ ] Persisten 10+ productos tras cerrar y abrir.
- [ ] Se pueden cambiar cantidades/unidades, eliminar y deshacer si aplica.
- [ ] Costes reales/estimados/sin precio se distinguen.
- [ ] No se fuerza autenticación para crear lista local si se aprueba esa opción.
- [ ] La aplicación sigue siendo útil offline.

## Gate G4: IA y menús
- [ ] Revisión del usuario antes de que la IA añada ítems/cambie presupuesto.
- [ ] Control de unidades, duplicados, porciones y alérgenos.
- [ ] Fallo/ausencia de IA no inutiliza lista local.
- [ ] Límites de coste y pruebas de entradas erróneas.

## Gate G5: datos de comercio
- [ ] Precio por unidad y tamaño comparable.
- [ ] Fecha, establecimiento y fuente visible.
- [ ] Fuentes autorizadas.
- [ ] Sin alegar stock ni ahorros que los datos no sostienen.
- [ ] Sin pagos integrados sin acuerdos y arquitectura segura.

## Entrega de Codex
- [ ] Resumen real de cambios + listado de archivos.
- [ ] PR/commit o explicación de por qué no existe.
- [ ] Resultado verificable de pruebas y advertencias.
- [ ] Evidencia gráfica de cada pantalla afectada.
- [ ] Estado del bloque y próximo paso actualizados.
