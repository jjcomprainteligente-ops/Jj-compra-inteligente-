# Auditoría V2 posterior a las correcciones - 30/10/2026

**Alcance:** activos y referencias visuales. **No** se auditó un repositorio ni una app ejecutándose.

- **18 hallazgos revisados**: 12 corregidos en diseño/documentación; 6 requieren app, dispositivo, Codex o aprobación.
- **16 pantallas canónicas** y **9 estados** B03.14; todas las imágenes tienen tamaño 374×754 px.
- **Logo original conservado byte a byte:** SÍ; SHA-256 `7500541f32e14292c013d80f6c8bbc43af87a94a7b646103d6b20289bacb47d0`.
- Barra de navegación de cuatro pestañas como única referencia; Bienvenida sin barra.
- Sin precios reales ni ahorros reclamados en las nuevas referencias; el presupuesto de 60 € se rotula como ejemplo.
- Contraste de muestra `titular_verde_sobre_crema`: **11.3:1** (cumple 4.5:1).
- Contraste de muestra `texto_secundario_sobre_crema`: **5.41:1** (cumple 4.5:1).
- Contraste de muestra `blanco_en_verde_accion`: **5.87:1** (cumple 4.5:1).
- Contraste de muestra `texto_verde_en_amarillo`: **8.3:1** (cumple 4.5:1).

## Pendientes que NO se deben declarar resueltos
- **AUD-07**: Medir contraste de todos los controles, Dynamic Type y 44x44 pt en iPhone.
- **AUD-08**: Probar teclado, safe area, hojas inferiores y diferentes tamaños.
- **AUD-10**: Validar conversiones, raciones, totales y operaciones atómicas.
- **AUD-11**: Probar permisos reales, errores de transcripción y alternativa manual.
- **AUD-13**: Aprobar 3D, reducir movimiento, omitir animación, accesibilidad.
- **AUD-15**: Validar consentimiento, almacenamiento local, borrado y permisos.

## Resultado
El paquete V2 está listo para **revisión visual del usuario y posterior inspección del repositorio por Codex**. La app no está certificada, programada ni desplegada por este trabajo.
