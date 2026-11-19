# V83 · Comprobación independiente previa a publicación

Revisión de solo lectura del 12/11/2026, a las 16:51 UTC. No se han modificado fuente, pruebas, índice de Git ni recursos externos. Solo se escribe este informe local. No se han repetido las suites completas.

## Resultado

**PASS en el alcance comprobado.** El catálogo y compilado revisados corresponden a 120 recetas V83 seleccionadas y las siete anteriores conservadas. Las otras 30 siguen retenidas; la autorización del usuario para publicar las 120 no confirma las catas o revisiones de los lotes retenidos.

## Evidencia leída y comprobada

- Fuente pública: `referencias/recetas-v83/fuente-publica/JJ_V83_120_RECETAS_FUENTE_PUBLICA.zip`, 639105 bytes, SHA-256 `5b310f4111b6b1a7bd21a32560b0283518e9d8bdb4e169da2715c51d69778b62`. Fijación correcta; está incluida en el índice de Git y no ignorada.
- El ZIP público contiene exactamente `120_RECETAS_FUENTE_ORIGINAL.json` y `PROVENIENCIA.json`. Comprobé 120 registros con posiciones exactas y cinco traducciones por registro (es/en/de/fr/bg), sin IDs de las 30 retenidas dentro de los registros de receta. La procedencia con IDs/estados/hashes forma parte del alcance expresamente planteado al propietario.
- Original completo: `referencias/recetas-v83/originales/JJ_V83_CIERRE_150_RECETAS_VERSION_LIGERA.zip`, 937580 bytes, SHA-256 `151e4fed4021e8e15b2a7b51a74dd3dfa342be8f1294fa33d8745c597ec00034`. Se conserva localmente, está ignorado y no aparece en el índice.
- Leí la constante JSON generada `V83_RECIPES`: 120 registros y el mismo conjunto de IDs que la fuente pública. Comparé el cuerpo literal de las siete recetas anteriores contra HEAD: idéntico. Por tanto siguen siendo 127 registros; no se sustituyeron los siete anteriores.
- Compilado web: `_expo/static/js/web/index-49e09bda4e883f0b0cc85ffaa8fdf16b.js`, SHA-256 `36c4882a03e15ae0b43ec71bafafd189616c721e965df14cb586ee94d2f16458`. Coincide con el artefacto informado. Busqué los 30 IDs excluidos en sus bytes: ninguno aparece.
- Resultado unitario real: 981 correctas, cero fallidas y cero omitidas, 27 archivos. Comprobé el hash del JSON real contra `technical-verification.json`.
- Resultado Chromium real: 298 correctas y 24 omisiones deliberadas, cero inesperadas; matriz completa y artefactos históricos intactos. Comprobé el hash del informe real contra su resumen público.
- Resultado WebKit real: 16 correctas, cero omitidas, cero inesperadas y cero intermitentes. Cuatro idiomas y tamaños CSS 375×667 / 430×932; no constituye prueba de Safari o iPhone físico.
- No hay cambios respecto a HEAD en `package.json`, `package-lock.json`, `app.json` o `assets/`. El logo original mantiene SHA-256 `ab7813942787048ff9a37ef86bce0b45bcf6e4a739e7427e679028e008c57596`. Los cambios de `src` quedan dentro del catálogo, recetas/i18n, filtros y sus dos componentes; no se han modificado proveedores de almacenamiento, hooks o fences.

## Por qué son 120 y no 150

- Posiciones 11–20: contradicción entre la capa superior `NO_PUBLICAR`/prueba no completada y las traducciones con cata aprobada.
- Posiciones 31–40: cata del usuario pendiente de forma coherente en fuente y traducciones.
- Posiciones 111–120: cierre/cata superiores aprobados, pero las traducciones mantienen `PENDING_USER_CONFIRMATION`.

Las traducciones de esas recetas sí existen. El problema es la coherencia de sus estados de aprobación, no la falta de contenido o idiomas.

## Límites

Esta comprobación no valida un despliegue nuevo de Vercel, un commit remoto aún no creado, recepción mediante compartir nativo, accesibilidad física, firma/instalación/TestFlight ni B07.2. El análisis de dependencias leído conserva tres avisos moderados de herramientas, cero altos y cero críticos. No se infiere una garantía absoluta de seguridad ni una certificación alimentaria o lingüística.

Al tomar esta instantánea había documentos históricos que describían el rechazo automático anterior; el responsable está registrando la nueva autorización expresa. Debe identificar en la entrega el commit real de GitHub y verificar la preview protegida antes de compartir el enlace. El permiso para publicar las 120 y sus manifiestos no cambia la reserva de las otras 30.
