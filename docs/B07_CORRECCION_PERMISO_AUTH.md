# B07.2 · Corrección del permiso de lectura de identidad

11/11/2026. **Corrección aplicada y regresión de lectura comprobada. La matriz completa de hogares sigue pendiente.** La autorización del propietario para la prueba SQL temporal está registrada; no es necesario volver a pedirla por chat.

## Qué detectó la ejecución real

La primera ejecución confirmada de `household_security.sql` llegó a PostgreSQL y falló con `42501: permission denied for schema auth` al iniciar `can_read_household`. La consulta de ACL efectiva confirmó que `postgres` tiene USAGE de Auth sin opción de concederlo, y el lector interno no lo tiene. El GRANT inicial no había conferido ese permiso, aunque la migración se aplicó sin error.

La ejecución fallida revirtió sus fixtures: posteriormente se comprobaron cero filas en Auth y en las 14 tablas de JJ, y ningún helper/relación temporal de la prueba quedó persistido. No se enviaron correos ni se tocaron datos de otra aplicación.

## Corrección mínima aplicada

Se conserva el lector interno NOLOGIN/NOBYPASS y sin acceso al schema administrado de Auth. La tercera migración `20261111190357_jj_policy_actor_lookup.sql`, SHA-256 `8fb74ba1c327bcc0841769884fd480aa55c5bc6a7043f6c518162c2d6fbe2f94`, añade un puente privado sin parámetros que devuelve únicamente el subject actual mediante `auth.uid()` y devuelve NULL para un UUID inválido. Su propietario es `postgres`; EXECUTE está denegado a PUBLIC/anon/authenticated/service_role y concedido al lector interno.

La función exterior, todavía propiedad de `jj_policy_reader`, usa ese puente y conserva obligatoriamente el gate de sesión real, estado de cuenta/revocación, hogar y membresía activos. El puente no autentica por sí solo. No se amplían los permisos de tablas ni se publica una RPC de mutación. Las migraciones anteriores permanecen inmutables; el nombre local de la nueva se alineó con la versión asignada por Supabase.

## Verificación real y límites

- Propietarios y ACL efectivos comprobados en catálogo; el lector sigue sin USAGE de Auth y los clientes no pueden ejecutar el puente.
- Regresión SQL de solo lectura ejecutada correctamente: diez condiciones, roles efectivos y ausencia de acceso a Auth comprobados. Incluye actor ausente/inválido, denegación en contextos sin sesión/hogar y puente inaccesible al cliente. Con la base vacía no se aísla cada causa de denegación; eso exige la matriz con fixtures.
- Los valores del JSON se comprueban expresamente con `node scripts/verify-b07-policy-report.cjs design/b07/reports/policy-actor-lookup-readonly.json`. La ausencia de un error SQL no basta para aprobar flags falsos o NULL.
- La regresión no crea tablas, funciones, usuarios ni datos; sus SET LOCAL se revierten con ROLLBACK.
- Cero filas en las 14 tablas de JJ y en usuarios/sesiones Auth; cero objetos temporales JJ tras las pruebas.
- Siete funciones privadas actuales. El asesor de seguridad mantiene diez INFO por metadata privada con RLS sin políticas para clientes, de denegación deliberada; sin WARN/ERROR en esa consulta. [Referencia del proveedor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- La batería original de hogares conserva exactamente su SHA-256 `e8cc847184e641ea53663a8be34f921c0a66967cf6ec7dbef9dfbc422a1606d1`; no se debilitaron sus aserciones para ocultar el fallo.

Después de corregir el permiso, dos nuevas solicitudes de la batería completa devolvieron confirmación interna caducada, sin ejecución SQL. La autorización del propietario no resuelve por sí sola ese aviso nativo. Se detuvieron los reintentos; no se cambió de canal para eludirlo ni se sustituyó la batería completa por la regresión parcial.

**B07.2 sigue abierto:** faltan los resultados completos A/B, propietario, invitaciones pendientes/revocación, historia, ledger y demás casos escritos. El primer error está corregido y su camino de lectura funciona, pero la prueba parcial no acredita toda esa matriz. Login real, firmas JWT, BFF/cookies, RPC, sincronización y prueba física siguen siendo entregas posteriores.

La aplicación, su diseño, las siete claves locales, el logo y las dependencias permanecen sin cambios. Se mantienen los resultados anteriores de 963 unitarias, 298 Chromium y las exportaciones de tres plataformas; no se repiten ni se atribuyen a una nueva implementación de cuentas.

## Evidencia

[Intentos de ejecución](../design/b07/reports/database-confirmed-attempts.json) · [Regresión de lectura](../design/b07/reports/policy-actor-lookup-readonly.json) · [Catálogo y limpieza](../design/b07/reports/policy-actor-lookup-catalog.json) · [Prueba de lectura reproducible](../supabase/tests/policy_actor_lookup.sql) · [Matriz completa preparada](../supabase/tests/household_security.sql).

Los informes iniciales de confirmación caducada y seis helpers se conservan como snapshots anteriores a esta tercera migración; este documento y los informes `policy-actor-lookup-*` reflejan el estado posterior.
