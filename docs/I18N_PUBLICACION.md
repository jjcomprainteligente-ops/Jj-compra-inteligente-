
# Publicación multilingüe I01/I02 — 31/10/2026

Estado: **READY**, despliegue de prueba **staging** del proyecto existente JJ Compra Inteligente.

- URL base: https://jj-compra-inteligente-m0ga298mt-cmj2hwhc6b-1051.vercel.app
- Despliegue: dpl_EijJvk6xY9bKAAS2EaYc9exGweNo.
- Acceso compartido facilitado al propietario: caduca el 01/11/2026 a las 14:27:50 UTC. No se guarda su parámetro en fuentes.
- B05 conserva su URL independiente; la protección del proyecto permanece activa.
- Cada origen web tiene datos locales propios. Esta vista empieza vacía y no traslada ni borra las listas de la vista anterior.

El propietario autorizó publicar automáticamente una vista de prueba separada al terminar y comprobar cada entrega. La instrucción se añadió al AGENTS.md existente, conservando sus reglas previas. No se solicitará otra confirmación para cada preview dentro de ese alcance.

## Verificación posterior a la subida

Se publicaron exclusivamente las 17 referencias del manifiesto: HTML, JavaScript compilado auditado, fuentes y configuración estática. Sin bundles nativos, datos del propietario, tests, credenciales ni metadatos .vercel. El SHA256 del JavaScript servido coincide con el auditado: daac04335e9c233edfc3a020c77ed547bced49b0a8613db4e6bdefa5a6e19348.

En la página publicada se comprobaron **es/en/de/fr**, en contextos nuevos de Chromium a 390×844:

1. Detección del idioma, bienvenida y cuatro pestañas traducidas.
2. Elegir y guardar idioma manualmente.
3. Crear una lista, preparar menú y revisar ingredientes.
4. Cancelar la propuesta conservando las compras.
5. Cambiar en Perfil → Idioma y recargar; la elección persiste sobre el idioma del navegador.
6. Las cuatro claves de negocio permanecen idénticas durante el cambio de idioma.
7. Se verificaron por HTTPS **23 URL**, incluidos los siete caminos de fuentes reescritos: estado200, tamaño y SHA1 idénticos al snapshot.

Resultado: **4/4 idiomas correctos, 23/23 archivos correctos, sin errores JavaScript o de carga detectados**. Datos ficticios solo en contextos de navegador desechables.

Evidencia: previews/i18n-web/.vercel/hosted-evidence/run-L9jTWt/report.json y doce capturas. Reproducción: JJ_PREVIEW_SHARE_URL='<enlace compartido vigente>' node scripts/verify-i18n-hosted.cjs. El cliente HTTPS de Node usa la CA configurada, con TLS verificado; las respuestas se entregan a Chromium sin alterar el almacén permanente de certificados.

Esta prueba web publicada se suma a la auditoría anterior de496 pruebas unitarias,124 recorridos y120 capturas. No acredita Safari/iPhone físico, VoiceOver, teclado o zonas seguras nativas. Continúan los13 avisos de herramientas Expo documentados; no es una distribución de producción ni una auditoría limpia de dependencias.

El ZIP previo I18N_Entrega.zip se conserva como snapshot auditado anterior a publicar. El código web y las fuentes de esta publicación corresponden al mismo contenido probado; este documento registra la publicación posterior.

