# Evidencia B07 · lectura del estado actual

La primera ejecución confirmada de la matriz completa falló por un permiso de schema Auth. La tercera migración corrigió ese fallo y la regresión acotada de lectura pasó diez condiciones comprobadas por el ejecutor. La batería completa posterior sigue sin resultado: caducaron dos confirmaciones internas de Supabase. **B07.2 permanece abierto.**

Evidencia posterior a la corrección: `database-confirmed-attempts.json`, `policy-actor-lookup-readonly.json`, `policy-actor-lookup-catalog.json` y `policy-actor-lookup-independent-review.md`. La regresión no crea datos, no aísla cada causa de denegación con fixtures y no sustituye la matriz A/B. Su checker reproducible es `scripts/verify-b07-policy-report.cjs`.

Los informes `database-behavioral-status.json`, `database-grants.json`, `database-empty.json` e `independent-review.md` conservan los snapshots iniciales de dos migraciones y seis funciones. Los nuevos informes reflejan tres migraciones y siete funciones. Los resultados unitarios/web anteriores corresponden a la app local, cuyo código no cambió con esta corrección.
