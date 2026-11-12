> **Estado vigente · 12/11/2026: autorización recibida.** El propietario respondió «Si publica las 120 ( porque no 150 ?)» a la solicitud expresa de publicar las 120 recetas, sus cinco traducciones y manifiestos de IDs, estados y hashes en el repositorio público. Se reanuda esa acción; no se interpreta como aprobación culinaria/editorial de las 30 retenidas. El registro que sigue describe el bloqueo anterior y se conserva como historial.

# V83 · Publicación pública pendiente de autorización

La integración local está implementada y comprobada: 120 recetas nuevas, siete anteriores preservadas y 30 retenidas hasta aclarar sus estados editoriales. TypeScript, 981 pruebas unitarias, 298 casos Chromium y 16 casos WebKit pasaron; las exportaciones web, iOS y Android terminaron correctamente. Los resultados y límites están en [el informe de integración](RECETAS_V83_INTEGRACION_Y_AUDITORIA.md) y `design/v83/reports/`.

## Acción detenida

El repositorio `jjcomprainteligente-ops/Jj-compra-inteligente-` es público. La revisión automática de aprobación rechazó crear el árbol de la entrega en GitHub porque la autorización anterior para usar GitHub como base del código no especifica claramente la exposición pública de este catálogo editorial y sus metadatos derivados. Publicarlos permite que terceros los lean y copien.

La publicación propuesta contiene el código editable, pruebas, documentación y 120 registros originales seleccionados con sus cinco traducciones, junto con los manifiestos técnicos de procedencia, IDs, estados y hashes. Los contenidos de las 30 recetas retenidas y el ZIP completo original de 150 permanecen fuera del índice de Git. La interfaz sigue en cuatro idiomas; el búlgaro se conserva en la fuente.

No se creó un commit, rama remota ni PR de V83. Antes del rechazo se prepararon tres objetos de archivo y un árbol intermedio mediante el conector; no forman una entrega referenciada por una rama. El índice local conserva el trabajo. No se volvió a intentar la acción rechazada ni se utilizó otra vía para publicarla.

La preview V83 no se ha publicado: el flujo autorizado exige guardar primero el código en GitHub. El enlace de la entrega anterior no acredita V83. La publicación necesita una autorización expresa para hacer público el catálogo y sus manifiestos, o una decisión separada sobre un destino privado. No se cambiará la visibilidad del repositorio automáticamente.

Este bloqueo no cambia las otras tareas pendientes: aclarar las 30 recetas, comprobar Safari/iPhone físico y accesibilidad nativa, preparar una aplicación firmada/TestFlight y completar B07.2. El análisis de dependencias conserva tres avisos moderados de herramientas, cero altos y cero críticos; no garantiza ausencia absoluta de vulnerabilidades.
