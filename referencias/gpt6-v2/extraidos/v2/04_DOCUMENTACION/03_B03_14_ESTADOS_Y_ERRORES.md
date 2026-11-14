# B03.14 - Estados especiales (9)

Cada pantalla lleva una salida útil y conserva la navegación canónica. No simular funciones como disponibles.

- **01 Lista vacía** → Añadir producto / añadir desde receta.
- **02 Sin precios verificados** → Volver a Mi compra con lista útil.
- **03 Sin conexión** → Seguir con almacenamiento local, sin afirmar sincronización.
- **04 Error temporal de red** → Reintentar sin duplicar acciones.
- **05 Micrófono denegado** → Escritura manual / Ajustes.
- **06 Cámara denegada** → Introducir código a mano / Ajustes.
- **07 Código no reconocido** → Entrada manual.
- **08 Producto ya en lista** → Comparar cantidades y confirmar.
- **09 Acción completada** → Confirmación + deshacer.

Se añadirán además estados de carga, listas de error específicas, suspensión de permisos y fallos de persistencia cuando Codex implemente los flujos. Probar con teclado y VoiceOver.
