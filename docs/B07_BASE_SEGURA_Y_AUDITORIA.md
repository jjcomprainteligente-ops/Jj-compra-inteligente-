# B07.1–B07.2 · Contratos y base de datos aislada

Entrega del 11/11/2026. **B07.1 construido y probado. B07.2 aplicado, con la matriz dinámica de permisos pendiente. B07 completo no está terminado.**

## Cambio real

El propietario autorizó Supabase, región UE y gasto máximo de 0 €, y después indicó continuar con la organización conectada y cambiar la cuenta más adelante. Se comprobó el plan `free` y una cotización de creación de `amount:0`, recurrencia mensual. Se creó un proyecto independiente **JJ Compra Inteligente**, referencia `fuarodipasfomhhrcsov`, Frankfurt `eu-central-1`, PostgreSQL `17.11.0.018`. No se habilitó un plan de pago.

Esta entrega no incorpora login a la aplicación, no envía correos, no importa las listas del dispositivo ni habilita sincronización. La aplicación local, sus siete claves, el diseño V2 y el logo original se conservan. La titularidad/cuenta definitiva de JJ queda pendiente según la indicación del propietario.

## B07.1 · Contratos construidos

- Veinte operaciones con tipos y validadores estrictos de solicitud; no son veinte endpoints implementados.
- Ámbitos diferentes para cuenta, invitación y hogar; crear hogar y canjear una invitación no requieren una membresía previa. La identidad y el rol se verificarán en el servidor.
- Revisiones y épocas positivas como strings decimales de int64, sin redondeo de JavaScript. Cantidades/unidades/categorías validadas.
- Límite de 256 KiB UTF-8, 20 listas y 1000 productos por lote. Rechazo de campos extra, accesores, datos con prototipo inesperado, controles/bidi y UTF-16 inválido, sin reescribir los nombres guardados.
- Proyección revisada e inmutable: nombre de lista/producto, cantidad, unidad, categoría y comprado. Excluye notas, precios, presupuesto, IDs locales y fechas.
- Preparación pura con IDs remotos aportados por el llamante y entrada canónica para un futuro digest. No existe todavía cola durable, hash remoto, recibo transaccional, deduplicación de servidor ni envío de esa preparación.

## B07.2 · Esquema aplicado

Dos migraciones aditivas, con historia remota y archivos locales alineados:

| Versión | Contenido | SHA-256 |
|---|---|---|
| `20261111154212` | Fundamento de 14 tablas y permisos | `a999b115c2b21bc7212f4697aa69010fbcb4d47c7c018eb7d7f84bb03f110c4b` |
| `20261111174718` | Alta de hogar activo e índices de FK | `8d346e2736022900d622efa37c2aa1af8d7b950e92b67480c8f417430803483f` |

Los archivos se generaron primero con `supabase migration new` del CLI oficial 3.1.0, instalado fuera de las dependencias de la aplicación. Al aplicar mediante MCP, Supabase asignó sus versiones de historia; se alinearon los nombres locales con esas versiones sin alterar el SQL aplicado. La migración base permanece inmutable.

Tres tablas de negocio permiten únicamente SELECT a `authenticated`, sujeto a RLS: hogar, listas y productos. Las once tablas privadas guardan controles de cuenta/sesión, pertenencias, namespaces/IDs, invitaciones, solicitudes, transferencias, recibos, lotes y trabajos de eliminación. Las 14 tienen RLS y FORCE RLS. No se concede escritura ordinaria a `anon`, `authenticated` ni `service_role`, ni se publica una RPC mutadora.

El gate privado exige actor actual, JWT no vencido, sesión existente y correspondiente en `auth.sessions`, identidad confirmada/no anónima/no bloqueada/no eliminada, cuenta JJ activa y sesión no revocada. Añade pertenencia y hogar activos; productos/listas eliminados quedan ocultos. Una cuenta JJ ausente falla de forma cerrada: no hay bootstrap automático de cuentas.

El helper que consulta Auth conserva propietario `postgres` y devuelve exclusivamente un booleano, sin aceptar un actor arbitrario. Esta excepción atraviesa RLS y depende de su código/grants acotados; FORCE RLS no elimina un bypass privilegiado. El helper exterior pertenece a un lector NOLOGIN/NOBYPASSRLS con columnas mínimas. No se modifican las políticas administradas de Auth.

Hay FK compuesta hogar/lista, propietario único con comprobación diferida de exactamente uno para hogares activos, avance de época al cambiar estado/rol, historia de membresía conservada mientras el hogar siga activo y ledger independiente para impedir reutilizar IDs eliminados. Esto no demuestra todavía carreras transaccionales de las futuras RPC. `session_epoch` está reservado, sin protocolo de emisión/binding activado.

## Verificación y auditoría de la pareja

- TypeScript y **963 pruebas unitarias** correctos, incluidas **147 nuevas de contratos**. Dependencias y lockfile de la app sin cambios.
- Exportaciones web, iOS y Android completadas. Exportar no equivale a ejecutar en iPhone físico.
- Inspección real de catálogo/grants: 14 tablas con RLS/FORCE, permisos de clientes restringidos y lector sin login/superusuario/bypass. Los clientes no heredan ese lector.
- HTTP real con publishable key, sin JWT de usuario: tres GET de tablas denegados con 401/42501; esquema privado denegado con 406/PGRST106. Esta última respuesta confirma que `jj_private` no está expuesto por la Data API.
- Comprobación real de filas: cero usuarios, sesiones y filas en las 14 tablas de JJ. Sin semillas persistentes ni correos de prueba.
- Revisión estática independiente completada; los hallazgos de validación/integridad detectados se corrigieron. Véase [informe independiente](../design/b07/reports/independent-review.md).
- Supabase informa diez avisos INFO por tablas privadas con RLS sin políticas de cliente: es el acceso denegado deliberado. No se añaden políticas permisivas para ocultar el aviso. [Explicación del proveedor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- Los dos avisos de cobertura de FK se corrigieron mediante la segunda migración. Persisten INFO de índices todavía no utilizados en la base vacía; no justifican retirar índices de integridad. [Explicación del proveedor](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
- Continúan los cinco avisos npm moderados de herramientas documentados en la entrega anterior; no se declara una aplicación sin avisos de dependencias.

**La matriz dinámica de PostgreSQL/RLS no se ejecutó.** Dos solicitudes devolvieron `status:expired`, `INVALID_ARGUMENT`, con «This confirmation expired after 2 minutes». Es una confirmación de Supabase caducada, no un resultado SQL ni un fallo demostrado de la suite. No se elude esa barrera ni se cuentan sus casos como aprobados. La prueba reproducible está en [household_security.sql](../supabase/tests/household_security.sql), SHA-256 `e8cc847184e641ea53663a8be34f921c0a66967cf6ec7dbef9dfbc422a1606d1`: crea fixtures con UUID nuevos en una transacción y termina en ROLLBACK. Requiere completar la confirmación nativa y comprobar después la ausencia de filas.

La suite escrita diferencia roles PostgreSQL/RLS reales con claims de prueba de un flujo real de Auth: declara `authLoginOrJwtSignatureVerified:false`. Aunque se ejecute correctamente, no probará por sí sola login, firmas, cookies, correo, dos conexiones concurrentes ni sincronización.

## Próximas entregas

1. Resolver la confirmación y ejecutar la matriz A/B/visitante/pending/revocado/sesión cerrada, propietario, épocas, ledger y pérdida de identidad; verificar limpieza. Hasta entonces B07.2 permanece abierto.
2. B07.3: cuenta opcional real, BFF web con cookies HttpOnly/Secure/SameSite y CSRF/origen; almacenamiento seguro nativo, renovación y cierre de la sesión actual. El paquete Vercel actual es estático y necesita rutas de servidor reales antes de habilitar este flujo.
3. Verificar remitente/plantillas y entrega de correo: SMTP predeterminado tiene restricciones y no acredita registro público operativo. No se enviaron mensajes para aparentar esta verificación.
4. B07.4: hogares e invitaciones con aprobación, revocación y transferencia. B07.5–6: RPC idempotentes, migración revisada y durable, cola por identidad/época, conflictos y privacidad remota.

Se mantiene la auditoría después de cada pareja. La preview de esta entrega conserva el funcionamiento local y no presenta cuentas/hogares como servicios activados.

## Fuentes técnicas consultadas

[Changelog](https://supabase.com/changelog.md), [sesiones](https://supabase.com/docs/guides/auth/sessions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [MCP y migraciones](https://supabase.com/docs/guides/ai-tools/mcp). Se revisaron los cambios de CLI v3, TLS y PostgreSQL antes de aplicar el esquema.


## Cierre de regresión web

La pasada final de Chromium terminó con 298 pruebas correctas, cero inesperadas/intermitentes y 24 omisiones deliberadas de matrices duplicadas. Incluye cuatro idiomas, 120 capturas de recorridos y 300 de cobertura canónica/estados; artefactos anteriores intactos. La primera pasada quedó interrumpida y se conserva sin contarla como aprobada. [Informe resumido](../design/b07/reports/browser-summary.json). La matriz dinámica SQL sigue pendiente; las comprobaciones web no la sustituyen.

Para nuevas funciones SQL, revocar EXECUTE explícitamente tras CREATE y conceder solo la firma necesaria: no confiar únicamente en ALTER DEFAULT PRIVILEGES por schema para retirar un grant global preexistente. Los seis helpers actuales tienen sus ACL inspeccionados.
