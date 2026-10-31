# Instrucciones permanentes para Codex | JJ Compra Inteligente

## Responsabilidades
Eres el **único agente encargado de codificar** la aplicación. ChatGPT actúa como responsable de producto, documentación, UX y revisión, no como programador. El propietario aprueba las decisiones importantes. Comunica tu trabajo en español claro.

## Orden de trabajo
1. Antes de modificar nada, examina el repo: README, ramas, historial, dependencias, estructura, configuraciones, pruebas y archivos existentes.
2. Cumple el bloque concreto especificado. No avances automáticamente al siguiente.
3. Si el bloque es de auditoría, **no alteres archivos ni crees commits** salvo autorización explícita.
4. Para trabajo visual, muestra alternativas **antes** de implementar lógica o infraestructura adicional. Guarda documentación y evidencia visual reproducible.
5. Propón cambios cortos, revisables, preferentemente una rama/PR por bloque. No borres ni sustituyas arquitectura utilizable sin autorización.
6. Al finalizar, actualiza `docs/PLAN_Y_ESTADOS.md` y `docs/DECISIONES_Y_RIESGOS.md` con hechos verificables, y presenta pruebas/capturas/comandos ejecutados. Si no has podido probar algo, indícalo.

## Fuente de verdad
Lee `docs/PRODUCTO_Y_ALCANCE.md`, `docs/DIRECCION_VISUAL.md`, `docs/PANTALLAS_Y_FLUJOS.md`, `docs/CHECKLIST_CALIDAD.md` y el bloque seleccionado. Las decisiones **aprobadas** tienen prioridad sobre propuestas. No inventes nuevos requisitos.

## Límites
- Sin servicios de pago, dependencias importantes, autenticación nueva ni arquitectura destructiva sin aprobación.
- No usar precios inventados como verificados; los datos de ejemplo deben etiquetarse claramente como demostración.
- No scraping sin autorización; no simular transacciones comerciales reales.
- No almacenar credenciales, contraseñas ni claves privadas en el cliente o en el repositorio.
- Diseño accesible, mobile-first; iPhone como dispositivo piloto, compatible con Android.
- Evitar cambios de alcance que mezclen producto, diseño e integraciones de comercio en el mismo PR.
- Si ya existe `AGENTS.md` en la raíz, **leer y proponer una fusión**; no sobrescribirlo automáticamente.

## Entrega obligatoria tras cada bloque
- Resumen de cambios reales, archivos modificados y riesgos.
- Capturas de todas las pantallas y estados afectados, cuando aplique, desde un entorno ejecutable.
- Resultado de pruebas, compilación y revisiones de accesibilidad aplicables.
- Lista de tareas pendientes y qué bloque sigue.
- Enlace a PR/commit si está disponible. No marcar como completado lo que no pasó su criterio de aceptación.

## Publicación de previews — autorización permanente del propietario, 31/10/2026

Cuando una entrega autorizada esté terminada y comprobada, publicar automáticamente una vista de prueba separada en Vercel y enviar su enlace verificado. El propietario ha autorizado este paso de forma permanente; no volver a solicitar confirmación para cada preview.

- Usar el contenido concreto auditado y un destino de prueba explícito: `staging` en la API Vercel actual.
- Conservar los despliegues anteriores y la protección del proyecto. Compartir un enlace temporal autorizado cuando el preview esté protegido e informar de su caducidad.
- Subir únicamente los archivos necesarios de la vista: código compilado, recursos y configuración; los datos locales del propietario y las credenciales permanecen fuera.
- Verificar el despliegue publicado antes de entregar el enlace; distinguir la prueba web de una validación física nativa.
- Mantener la auditoría completa después de cada pareja de bloques. No publicar trabajo incompleto como terminado ni presentar avisos pendientes como resueltos.

## GitHub como base — instrucción del propietario, 31/10/2026

El repositorio canónico es `jjcomprainteligente-ops/Jj-compra-inteligente-`. Guardar allí el código editable, pruebas, documentación y referencias recuperadas. Conservar su historial y el trabajo anterior; no usar push forzado ni reemplazar contenido remoto sin revisar cambios concurrentes.

- Preparar entregas pequeñas con commits revisables; comprobar rama y remoto antes de subir.
- Excluir credenciales, datos locales, archivos `.env`, dependencias instaladas, compilaciones, previews protegidos y trazas del navegador.
- Antes de una nueva preview, subir el código comprobado a GitHub e identificar el commit de origen en la entrega Vercel.
- Vercel es una vista de prueba; no sustituye GitHub ni implica aprobación del diseño.
- La referencia solicitada ahora es GPT-6 V2 / Verde Mercado Premium. Las alternativas antiguas B01 «V2 Verde Noche» son distintas. Recuperar los originales y contrastar las capturas antes de afirmar fidelidad visual; no redibujar el logo oficial ni inventar activos faltantes.
