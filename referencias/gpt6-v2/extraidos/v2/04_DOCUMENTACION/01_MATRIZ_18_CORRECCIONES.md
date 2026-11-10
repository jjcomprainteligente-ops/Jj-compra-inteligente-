# Corrección individual de 18 hallazgos

| ID | Problema | Estado V2 | Corrección | Pendiente para Codex / validación |
|---|---|---|---|---|
| AUD-01 | Logo alterado entre maquetas | CORREGIDO EN DISEÑO | Logo 2D desde imagen del usuario; SHA-256 idéntico. No se aprobó una nueva versión 3D. | Codex incorpora el recurso exacto; validar icono y animación 3D con usuario. |
| AUD-02 | Cinco pestañas en algunas capturas | CORREGIDO EN DISEÑO | 16 vistas canónicas usan 4 pestañas salvo Bienvenida (sin barra). | Validar navegación real y retorno desde subpantallas. |
| AUD-03 | Precios, promociones y ahorros inventados | CORREGIDO EN DISEÑO | Las vistas nuevas muestran sin precios conectados; 60 EUR rotulado ejemplo. | Conectar precios solo con autorización, fuente y fecha. |
| AUD-04 | Detalle de producto con versión antigua | CORREGIDO EN DISEÑO | Tomates rama mostrado sobre crema neutra, sin caja amarilla de nombre. | Sustituir referencia antigua al implementar. |
| AUD-05 | Estados de aprobación contradictorios | CORREGIDO EN DOCUMENTOS | Índice nuevo separa decisiones aprobadas, referencias nuevas y validaciones pendientes. | No inferir aprobación desde nombres de ZIP heredados. |
| AUD-06 | Paleta y tarjetas inconsistentes | CORREGIDO EN DISEÑO | Sistema único con #103F2D, #167347, #FFD24A, #FFF8E7. | Crear tokens reales sin reinterpretaciones. |
| AUD-07 | Texto pequeño y accesibilidad | PENDIENTE PRUEBA APP | Se corrigió color secundario a #566B5F; contraste de muestras medido. | Medir contraste de todos los controles, Dynamic Type y 44x44 pt en iPhone. |
| AUD-08 | Solapamiento de CTA y zonas seguras | PENDIENTE PRUEBA APP | Estructura de CTA separado de tab bar en referencias nuevas. | Probar teclado, safe area, hojas inferiores y diferentes tamaños. |
| AUD-09 | Presupuesto mezclado con gasto real | CORREGIDO EN DISEÑO | Separados: límite de ejemplo, gasto sin registrar, estimación sin precios y ahorro no calculado. | Asegurar cálculo y origen de cada indicador. |
| AUD-10 | Duplicados, peso y cantidades | PENDIENTE PRUEBA APP | Flujo de revisión distingue nuevo, ya lo tengo y ya está en mi lista. | Validar conversiones, raciones, totales y operaciones atómicas. |
| AUD-11 | Voz y cámara sin estados de fallo | PENDIENTE PRUEBA APP | Diseñados estados de cancelación, permiso denegado y barcode desconocido. | Probar permisos reales, errores de transcripción y alternativa manual. |
| AUD-12 | Funciones futuras simuladas como activas | CORREGIDO EN DISEÑO | Hogar colaborativo: Próximamente; alertas de precio sin fuentes: no disponibles. | Activar solo tras implementación y acuerdos. |
| AUD-13 | Bienvenida/3D aún sin cierre | PENDIENTE VALIDACIÓN | Bienvenida 2D canónica y acceso sin cuenta preparados. | Aprobar 3D, reducir movimiento, omitir animación, accesibilidad. |
| AUD-14 | Fotos, origen y nutrición sin fuente | CORREGIDO EN DISEÑO | Vistas nuevas omiten alegaciones de origen, valor nutricional y fotografías generadas como prueba. | Crear política de fichas y fuentes verificables. |
| AUD-15 | Privacidad, permisos y modo local | PENDIENTE PRUEBA APP | Perfil muestra modo local sin sincronización y opciones de privacidad. | Validar consentimiento, almacenamiento local, borrado y permisos. |
| AUD-16 | Flujos y menú inconsistentes | CORREGIDO EN DISEÑO | Inicio compra; Menús semana/recetas; Ahorro presupuesto/comparar; Perfil por acceso secundario. | Probar el mapa de rutas funcional. |
| AUD-17 | Estados vacíos y errores ausentes | CORREGIDO EN DISEÑO | B03.14 incorpora 9 pantallas: vacío, sin precio, offline, error, permisos, barcode, conflicto, éxito. | Implementar estados y probar resiliencia. |
| AUD-18 | Paquetes históricos y referencias duplicadas | CORREGIDO EN DOCUMENTOS | Nuevo paquete v2 incluye solo referencias canónicas y matriz; históricos no son fuente activa. | Tras implementación, versionar única fuente en GitHub. |

## Lectura del estado
- CORREGIDO EN DISEÑO / DOCUMENTOS = solucionado en la versión visual v2, **no** verificado en la app.
- PENDIENTE = requiere dispositivos, implementación o aprobación formal.
