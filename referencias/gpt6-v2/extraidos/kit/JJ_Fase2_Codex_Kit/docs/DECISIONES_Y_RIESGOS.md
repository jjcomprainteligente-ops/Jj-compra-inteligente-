# Registro de decisiones, preguntas y riesgos
**Regla:** nunca elevar una propuesta a «aprobada» sin confirmación del usuario.

## Decisiones confirmadas
| ID | Fecha | Decisión |
|---|---|---|
| D01 | 2026-10-29 | Marca oficial: JJ Compra Inteligente |
| D02 | 2026-10-29 | Color principal verde |
| D03 | 2026-10-29 | Lanzamiento/validación inicial en Tenerife |
| D04 | 2026-10-29 | Codex hace toda la programación de la app. ChatGPT diseña, especifica y revisa. |
| D05 | 2026-10-29 | Priorizar calidad visual antes de desarrollo de funciones |
| D06 | 2026-10-29 | Preservar repo existente y minimizar costes |
| D07 | 2026-10-29 | La integración de compra dentro de JJ es meta comercial futura, no función prometida de MVP |

## Propuestas pendientes de revisión
| ID | Propuesta | Qué necesitamos verificar |
|---|---|---|
| P01 | Dirección visual V1 Verde Esencial | comparar alternativas en screenshots |
| P02 | Paleta `#167347`/`#133D2D` | verificar contraste y aprobación |
| P03 | Navegación 4 tabs + Perfil en avatar | prototipo y pruebas con usuarios |
| P04 | Expo / React Native / TypeScript | diagnóstico de arquitectura actual |
| P05 | Supabase / backend IA | costes, seguridad, situación del repo |
| P06 | Listas básicas sin cuenta obligatoria | viabilidad de persistencia + migración |
| P07 | Modo demo de comparador sin precios inventados | fuente real de observaciones de precio |

## Riesgos abiertos
| ID | Riesgo | Mitigación |
|---|---|---|
| R01 | No hay visibilidad del repo desde ChatGPT | verificar conexión y permisos de GitHub/Codex |
| R02 | Diseño genérico o poco premium | tres rutas, screenshots a escala real y revisión con usuario |
| R03 | Precios o stock inexactos | origen, fecha, unidad y aviso de faltantes |
| R04 | Integraciones de tiendas no autorizadas | separar compra presencial de checkout integrado |
| R05 | Suscripciones/servicios innecesarios | aprobar gastos antes de activarlos |
| R06 | Falta de continuidad entre tareas de Codex | AGENTS + tablero + decision log + PRs pequeños |
| R07 | Datos de compra familiares sensibles | aislamiento, permisos por hogar, borrado de datos |
| R08 | Cambios no probados en iPhone | screenshots, pruebas y QA antes de aprobar |

## Preguntas abiertas (no bloquean la auditoría)
- URL/owner del repo, rama principal y estado técnico real.
- ¿Qué variante de marca prefiere el propietario tras ver 3 propuestas?
- ¿Qué primer grupo de 20–30 testers en Tenerife podría validar flujos reales?
- ¿Cuáles serán las fuentes legales de precios para la prueba piloto?

## Referencias visuales e históricas archivadas
- `referencias/JJ_Compra_Inteligente_Tres_Conceptos.png`: tres prototipos **anteriores**, sirven para entender el concepto A+B+C, no para aprobar estética final.
- `referencias/JJ_Compra_Inteligente_Fase_2_Estudio_y_Diseno.pdf`: investigación anterior, separar datos verificados de hipótesis.
- `referencias/JJ_Compra_Inteligente_Fase2_Brief_Codex.md`: brief inicial del proyecto.
