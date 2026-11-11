# Supabase · B07 en desarrollo

Proyecto aislado JJ Compra Inteligente, UE (`eu-central-1`), plan gratuito. No hay cuentas ni datos de usuario importados. La app local no está conectada a esta base todavía.

Las migraciones son inmutables y sus versiones coinciden con `list_migrations` de Supabase. Se generaron con el CLI oficial **3.1.0**, fuera de las dependencias de Expo. Antes de ejecutar comandos, consultar `supabase --help` y la ayuda del subcomando: v3 apunta a local por defecto y cambió las opciones antiguas. No contiene contraseñas, tokens, claves privadas ni configuración de acceso.

- `migrations/`: esquema y endurecimiento incremental aplicados en el proyecto aislado. No aplicar sobre un proyecto ajeno ni repetir una versión ya registrada.
- `tests/household_security.sql`: batería transaccional con fixtures propios y ROLLBACK. Todavía pendiente de ejecución por confirmación de Supabase caducada; no constituye un resultado de pruebas. No ejecutarla sobre datos personales ni producción.
- `../scripts/verify-b07-anonymous.cjs`: GET reales para verificar denegaciones anónimas y schema privado no expuesto. Necesita `JJ_SUPABASE_URL` y una `JJ_SUPABASE_PUBLISHABLE_KEY` válida en el entorno. Nunca acepta una clave secreta/service_role. En entornos con proxy, Node 24 admite `NODE_USE_ENV_PROXY=1`; conservar proxy y CA del entorno.

Estado, evidencia, permisos y fronteras: [auditoría de B07.1–2](../docs/B07_BASE_SEGURA_Y_AUDITORIA.md). No hay RPC de mutación, bootstrap de cuentas, sincronización ni tareas de purga activadas.
