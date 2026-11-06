# Preview V2 verificada — 06/11/2026

> **Nota de alcance:** publicación y pruebas remotas correctas de la aplicación existente; preparación total V2 incompleta. Consultar la [auditoría integral](AUDITORIA_COMPLETITUD_V2.md).


Estado: READY, destino staging, proyecto existente JJ Compra Inteligente. No se promociona producción ni se retira su protección.

- Despliegue: `dpl_FEo2wA8AwT4zmcZeGFxSBWpgaL7A`.
- Código/paquete: `3dbcff9435a6d2aad97e7766e2e38d0fabe790c7`, rama `codex/v2-visual`.
- Revisión: [PR #1](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/1).
- Origen protegido: https://jj-compra-inteligente-8ag2xpk4x-cmj2hwhc6b-1051.vercel.app
- Alias de revisión: https://jj-compra-inteligente-v2-3dbcff9-cmj2hwhc6b-1051.vercel.app
- El enlace temporal compartido con el propietario caduca el 07/11/2026 21:01:25 UTC. Su credencial permanece fuera de Git.

La comprobación remota pasó en los cuatro idiomas y en 27 recursos/URLs: bienvenida, navegación, logo, fuentes/licencias, guardado de lista, revisión y cancelación de ingredientes, cambio de idioma y persistencia después de recargar, conservando los documentos de negocio. Evidencia inicial completa con 12 capturas en `design/v2/hosted/run-2026-11-06T19-05-33-744Z-9ylBZ8/`.

El JavaScript recibido después de decodificar Brotli coincide exactamente con el export auditado: SHA-256 `08d9e75e028ea07d448f00b8061224cfc990506cc15f39a8c25d09070f8e690d`. El logo coincide con el PNG entregado: `ab7813942787048ff9a37ef86bce0b45bcf6e4a739e7427e679028e008c57596`. Manifiesto y configuración exactos en `design/v2/audit/publication-*.json`.

El primer informe remoto se conserva: exigía que un peso de fuente no utilizado por Bienvenida ya estuviera cargado. Se corrigió el verificador para solicitar explícitamente las cinco familias antes de comprobarlas; la siguiente ejecución pasó completa. No se modificaron la app ni las fuentes.

V01/V02 quedan en revisión visual del propietario. Se mantienen los límites del informe de auditoría: validación física iPhone/Safari, avisos de dependencias y módulos aún ausentes. Las 16 referencias y nueve estados no equivalen a una implementación completa de todas las funciones.

El alias compartido también pasó la comprobación completa en los cuatro idiomas y 27recursos/URLs. Informe `design/v2/audit/alias-hosted-report.json`.
