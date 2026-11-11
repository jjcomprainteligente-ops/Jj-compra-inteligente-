# Auditoría independiente B07.1–B07.2 · Contratos y fundamento aislado

Fecha: 11/11/2026. Revisor: `b07_readonly_security`. Alcance: lectura estática independiente de contratos, migraciones y pruebas; sin cambios de aplicación, ejecución SQL, acceso a datos remotos ni commits. Este informe es la única escritura propia de esta revisión.

## Resultado y estado de aceptación

**No quedan hallazgos P0/P1 ni P2 abiertos en los artefactos estáticos revisados para el corte de solicitudes locales y SELECT condicionado.** Los hallazgos concretos de validación/integridad detectados durante la revisión se corrigieron y se añadieron regresiones. Esto no certifica ausencia absoluta de fallos.

**La matriz de comportamiento de PostgreSQL/RLS todavía NO está verificada.** El agente principal informa que los intentos de ejecutar la suite devolvieron una confirmación caducada (`INVALID_ARGUMENT`, confirmación expirada tras dos minutos), no un resultado SQL. No debe presentarse esa suite como ejecutada, aprobada ni fallida por un defecto del esquema. Queda pendiente completar la confirmación nativa de Supabase y obtener su resultado real. La inspección de grants y las peticiones HTTP anónimas son evidencias distintas y no sustituyen esta matriz.

El alcance aplicado que comunica el agente principal es un proyecto JJ separado en Frankfurt, plan gratuito de 0 €, con esquema aislado. Esta auditoría no modifica recursos remotos. B07 completo sigue pendiente: no hay login/OTP, cookies/BFF, almacenamiento seguro nativo, RPC mutadoras públicas, invitaciones operativas, sincronización ni importación desde la aplicación.

## Artefactos identificados por contenido

| Artefacto | SHA-256 revisado |
|---|---|
| `src/domain/householdContracts.ts` | `f4226e9b362e75a938afeb3df4caf9b667a1c4912619011bcef651acffb52f63` |
| `tests/household-contracts.test.ts` | `ad24788418dd11f21170864148ed4d44f92de79b79bb2192a953a5a8c9175ec6` |
| Base `supabase/migrations/20261111154212_jj_household_foundation.sql` | `a999b115c2b21bc7212f4697aa69010fbcb4d47c7c018eb7d7f84bb03f110c4b` |
| Incremental `supabase/migrations/20261111154328_jj_foundation_integrity_indexes.sql` | `8d346e2736022900d622efa37c2aa1af8d7b950e92b67480c8f417430803483f` |
| `supabase/tests/household_security.sql` | `e8cc847184e641ea53663a8be34f921c0a66967cf6ec7dbef9dfbc422a1606d1` |
| `scripts/verify-b07-anonymous.cjs` | `699581d845d70d3399e514b8851b29ba42f5295a09fff970d13fc967efcaf95d` |

La base tiene 420 líneas; la incremental, 40. El agente principal comunica historia remota `20261111154212` para la base y `20261111174718` para la incremental. Al tomar estos hashes el nombre local de la incremental todavía era `20261111154328_...`: **alinear su nombre con la versión remota antes del commit**, conservando exactamente el contenido aplicado y la base inmutable. Se revisó la combinación base + incremental, no el borrador histórico de 423 líneas que mezclaba ambos cambios.

## Hallazgos concretos y resolución

| Gravedad original | Hallazgo | Resolución estática comprobada |
|---|---|---|
| P2 · validación local | La proyección revisada leía directamente getters de `name/items/category`, a diferencia del parser de solicitudes. Un getter de `name` se ejecutaba y la proyección se aceptaba. | `householdContracts.ts:103–112` usa descriptores propios de campos permitidos; `:361,366` lo aplica a listas/ítems. `prepareReviewedHouseholdImport`, `:393`, valida también su objeto superior. La revisión auxiliar reprodujo en memoria el resultado corregido: cero llamadas al getter y `invalid-shape`. No era una vía HTTP ni autorización remota en este corte. |
| P2 · historia de permisos | El primer borrador admitía cambiar estado/rol sin avanzar época y borrar/reinsertar una membresía mientras el hogar estaba activo, perdiendo su historia. | Base, `lock_membership_household`, `:285–312`: identidad inmutable, época estrictamente superior al cambiar estado/rol y rechazo de DELETE físico bajo hogar activo. Suite SQL `:580–595`: regresiones de reingreso, revocación, cambio de rol y conservación de historia. Suite aún no ejecutada. |
| P2 · integridad de colección | El primer borrador permitía insertar/editar un ítem bajo una lista con tombstone; RLS ocultaba el contenido, pero el trigger no rechazaba la mutación privilegiada. | Base, `attach_resource_id`, `:221–224`, y `protect_resource_lifecycle`, `:256–262`: padre vivo del mismo hogar, con bloqueo. Suite `:624–632` aproximadamente, identificada por nombres `cannot_insert_under_soft_deleted_parent` y `cannot_update_item_under_soft_deleted_parent`. No había DML/RPC pública que explotara este borde. |
| P2 · namespace | INSERT administrativo de hogar inicialmente `deleting/deleted` no pasaba por el cierre aplicado en UPDATE y podía dejar su namespace abierto. | Incremental, `attach_resource_id`, `:8–12`: el alta de hogar exige `active`, con `JJ_HOUSEHOLD_STARTS_ACTIVE`. Suite `:556–559` espera exactamente ese error. |
| P2 · coherencia de datos | SQL exigía recortar nombres mientras el contrato conservaba los espacios revisados; una solicitud aceptada podía fallar al persistir. | Base, nombres de hogar/lista/ítem `:55–56,80–81,93–94`: conservan espacios extremos y rechazan controles/bidi. No se normaliza silenciosamente el contenido revisado. Las diferencias de cómputo Unicode se documentan más abajo. |
| P3 · prueba | Un caso de error/confidencialidad del test TS podía terminar sin entrar en el bloque de aserciones esperado. | `tests/household-contracts.test.ts:109–110` incorpora `expect.assertions(3)`. Las pruebas de accesores incluyen rechazo y contador cero. |

## Autorización de lectura y privilegios

La combinación revisada no concede DML ordinaria ni RPC mutadoras públicas. `authenticated` dispone de SELECT sobre las tres tablas de negocio; cada política exige el gate vigente. La bandera de propuesta `directBusinessDMLForAuthenticated:false` se concreta como prohibición de escritura directa, no como ausencia de SELECT.

Base `:340–364`, `has_live_session()`:

- Obtiene actor con `auth.uid()` y sesión desde `auth.jwt()`; no acepta un actor arbitrario por parámetro.
- Exige rol claim `authenticated`, identificador de sesión bien formado y `exp` vigente respecto de `clock_timestamp()`.
- Exige fila real de `auth.sessions` perteneciente al actor y `not_after` no vencido.
- Comprueba identidad Auth no eliminada, no anónima, correo confirmado y ausencia de bloqueo vigente.
- Exige `account_controls.state='active'` y ausencia de revocación del identificador de sesión en JJ.
- Devuelve exclusivamente booleano, sin correos, tokens, membresías ni contenido. No registra ni renueva sesiones.

Base `:371–379`, `can_read_household(uuid)`, añade hogar activo y membresía activa del actor. Las políticas `:403–410` aplican ese helper a hogar/listas/ítems y exigen recurso vivo; los ítems requieren además una lista padre viva. No existe autoridad basada en `user_metadata`, rol almacenado por la UI ni un `actorId` enviado como permiso.

### Excepción privilegiada mínima y justificada

El helper interior `has_live_session` conserva propietario `postgres`, porque las tablas administradas de Auth ya tienen su propio RLS: conceder SELECT a un rol nuevo no le daría por sí solo lectura de esas filas. Se evita modificar las políticas administradas de Auth o conceder `BYPASSRLS` al lector general.

Esta excepción es deliberada: **el helper de propietario `postgres` puede atravesar RLS; `FORCE ROW LEVEL SECURITY` no elimina ese privilegio.** Su seguridad depende del cuerpo acotado, identidad derivada de claims, salida booleana, ausencia de parámetros de actor y grants estrechos. No debe reutilizarse como una función genérica para consultar Auth.

El helper exterior pertenece a `jj_policy_reader`: NOLOGIN, NOBYPASSRLS, sin superusuario ni capacidad de crear roles. Solo recibe columnas `households(id,status)` y `memberships(household_id,user_id,status)`, políticas de lectura específicas y EXECUTE del helper interior. No recibe hashes de invitación, recibos ni controles personales. El CREATE de schema temporal usado para transferir propiedad se revoca después.

Todos los helpers/trigger functions privados tienen `search_path=''` y referencias calificadas a tablas. Se revoca EXECUTE a PUBLIC/anon/authenticated/service_role; únicamente `authenticated` recibe el helper exterior y el lector privado recibe el interior. USAGE de schema no concede SELECT de tablas ni lo incorpora automáticamente a los schemas expuestos de la Data API. La función reemplazada en la incremental vuelve a revocar EXECUTE explícitamente.

Las once tablas de metadata usan RLS/FORCE y default deny para clientes. Las políticas `using(true)` existentes corresponden exclusivamente al lector interno limitado; no son políticas de acceso general de `authenticated`. Los avisos informativos por tablas privadas sin política de cliente no deben resolverse abriendo filas a los clientes.

## Invariantes de propietario, recursos y épocas

- El índice parcial de owner, base `:73–74`, impone **como máximo uno** inmediatamente. Los constraint triggers `:331–335` y su checker `:314–329` imponen **exactamente uno al final de la transacción** para cada hogar activo. Es correcto permitir el estado transitorio sin owner dentro de la misma transacción de creación/transferencia; no es una garantía tras cada sentencia aislada.
- El trigger BEFORE de membresías bloquea la fila del hogar antes de modificar su pertenencia; la verificación deferred no se limita a contar filas sin coordinación. La suite fuerza `SET CONSTRAINTS ALL IMMEDIATE` para comprobar el fallo por cero owners y el éxito de una transferencia representada por filas, y luego restablece modo deferred.
- Las membresías activas o revocadas no se eliminan físicamente mientras el hogar siga activo. Reingresar exige época nueva; las épocas son bigint positivos. El cliente las transporta como decimal validado para evitar redondeo de JavaScript.
- `resource_ids` conserva attachment histórico independiente de contenido y recibos. El attach es un UPDATE condicionado dentro de la misma sentencia que crea el recurso; una inserción fallida revierte su consumo. El FK compuesto de ítems mantiene hogar/lista coherentes.
- La eliminación marca ledger y el namespace cerrado no puede reabrirse por UPDATE. El guard incremental impide un alta inicialmente cerrada que eluda ese recorrido. Purga de contenido no equivale a purga del ledger; no se ha añadido ningún purgador.
- Los bloqueos presentes no equivalen a un protocolo completo de mutaciones remotas. Por ejemplo, un UPDATE de ítem ya tiene su fila cuando su trigger toma la lista; una futura RPC de borrado de lista que después actualice hijos debe prebloquear lista→ítems en orden consistente. Este corte no contiene esa RPC ni afirma haber probado carreras CRUD, logout o borrado de cuenta.

## Contratos TS: alcance comprobado

- Hay 20 nombres de operaciones y validadores de solicitud, sin cliente Supabase, red, credenciales, persistencia ni autoridad de servidor.
- Scope cuenta para crear hogar/cerrar sesión/borrar cuenta; scope invitación para canjear sin membresía previa; scope de recibo cuenta u hogar; las operaciones de hogar requieren su identificador y época. Evita aplicar erróneamente una pertenencia previa a crear/canjear.
- Se rechazan campos extra, símbolos, accessors, prototipos no planos, arrays dispersos y propiedades ocultas en el sobre/payload. No se copia un `actorId` como autoridad. La proyección local inspecciona únicamente los campos permitidos y conserva una copia congelada sin alias.
- Revisión/época usan strings decimales positivos hasta int64; cantidades son enteros seguros, con unidades y categorías cerradas y regla de unidades enteras.
- `parseHouseholdOperationJSON`, `:330–335`, comprueba tamaño bruto antes de JSON.parse. El contador UTF-8 rechaza UTF-16 inválido; nombres rechazan controles y bidi. Hay límites de 256 KiB, 20 listas y 1000 ítems por lote.
- El input canónico de digest incluye versión, operación, scope/época y payload/revisiones. Ordena claves con UTF-16/`Object.keys().sort()` y conserva orden de arrays; la identidad verificada se vincula aparte en servidor. No se afirma equivalencia automática con `jsonb::text` de PostgreSQL.
- `householdOperationHashInput` devuelve texto canónico, **no un digest, firma, recibo ni deduplicación**. El canje incluye el secreto de invitación; la documentación exige hashearlo en memoria y no registrar/persistir ese texto.
- `prepareReviewedHouseholdImport` exige IDs aportados y estables; no los genera al reintentar. Explica que el llamante debe guardar y verificar durablemente el lote antes del primer envío. Aquí todavía no existe esa persistencia ni se ha enviado nada.

Fronteras concretas que siguen abiertas para futuras entregas, sin constituir un fallo público de este corte:

- `account_controls.session_epoch` está reservado; ningún helper lo vincula todavía a una sesión emitida. No atribuirle invalidación global de sesiones por sí solo. La revocación que sí comprueba el gate es por `session_id`.
- SQL usa `char_length`/`btrim`, mientras TS usa longitud UTF-16 y `trim`: SQL puede aceptar algunos nombres que el parser rechaza, por ejemplo más caracteres astrales o ciertos espacios Unicode. Al no existir DML cliente, el parser puede ser una precondición estricta de las futuras RPC/API; no afirmar igualdad byte a byte de ambos validadores.
- El esquema de recibos es almacenamiento restringido; no implementa todavía las transacciones idempotentes, la comparación de digest, la autorización de lectura de recibos ni la recuperación de tokens mostrados una sola vez. Son criterios de las RPC futuras.

## Revisión de las pruebas y evidencia disponible

La suite SQL se revisó estáticamente. Abre una transacción, crea fixtures con UUIDs de esa ejecución y termina en ROLLBACK. Sus helpers temporales son SECURITY INVOKER; no convierten un SELECT con rol de usuario en una consulta privilegiada. `jj_sqlstate` falla si no se produce el error esperado y puede exigir mensaje exacto; `jj_assert` no acepta NULL como éxito.

La cobertura escrita incluye A/B/owner/member/pending/revocado/extraño; sesión ausente/ajena/vencida/revocada/retirada; claims malformados; email no confirmado, usuario anónimo/bloqueado/eliminado y cuenta en eliminación; metadata editable sin autoridad; denegación de DML/TRUNCATE y metadata privada; no herencia del lector; grants de service_role en tablas privadas y públicas; FORCE RLS; owner único/deferred; épocas; FK cruzada; padre eliminado; identidad sin cascada comercial; ledger tras purga y namespace cerrado. No son resultados de ejecución hasta que Supabase devuelva un informe SQL real.

La suite declara `authLoginOrJwtSignatureVerified:false`. Es la frontera correcta: establecer claims de prueba y `SET ROLE` comprueba roles/políticas reales cuando se ejecute, pero **no autentica por Supabase Auth, no verifica firmas JWT ni prueba una sesión/login HTTP**. Tampoco usa dos conexiones para demostrar carreras transaccionales.

El script HTTP anónimo solo hace GET con publishable key y sin JWT de usuario. No crea usuarios/filas y no registra claves ni cuerpos de proveedor. Sus tres lecturas públicas exigen 401/403 y código 42501. El probe de schema privado admite 42501 o PGRST106: prueba «no legible». Para afirmar específicamente «no expuesto» hace falta PGRST106 o inspección de configuración; un 42501 aislado también puede venir de un schema expuesto con grants denegados. No confundir lectura del script con ejecución: este revisor no lo ejecutó.

El agente principal comunica 963 pruebas unitarias aprobadas, TypeScript aprobado y exportaciones de las tres plataformas aprobadas. Son comprobaciones comunicadas por el ejecutor, no repetidas por este revisor. La revisión auxiliar de contratos solo hizo una reproducción Node en memoria del caso de getters; no escribió archivos ni ejecutó SQL.

## Pendientes para cerrar honestamente B07.1–B07.2

1. Alinear el nombre de la migración incremental con historia remota `20261111174718`, manteniendo hashes aplicados y base inmutable.
2. Completar la confirmación nativa pendiente y ejecutar `household_security.sql` hasta recibir un informe real; comprobar el ROLLBACK y ausencia de fixtures persistentes después. No sustituir esta barrera por un canal alternativo para eludir la confirmación.
3. Adjuntar resultados de inspección de grants/advisors y del HTTP anónimo cuando los ejecute el agente principal, distinguiendo cada prueba.
4. Documentar la entrega como contrato + fundamento de lectura aislado; mantener Auth UI/BFF/credenciales de sesión, firmas/login reales, mutaciones, idempotencia y sincronización pendientes. La preview conserva la aplicación local, sin controles que prometan servicios todavía ausentes.

Este informe no autoriza ni ejecuta pasos adicionales; registra la revisión dentro del alcance ya autorizado por el propietario.


## Anexo del ejecutor posterior a esta revisión

El nombre de la segunda migración se alineó a `20261111174718_jj_foundation_integrity_indexes.sql`, sin cambiar su SHA-256. El probe HTTP se endureció para exigir exactamente 406/PGRST106 en el schema privado; su SHA-256 final es `699581d845d70d3399e514b8851b29ba42f5295a09fff970d13fc967efcaf95d`. La ejecución HTTP pasó los cuatro checks. Catálogo real: 14 tablas RLS/FORCE y grants restringidos; 16 recuentos de datos iguales a cero y ningún cliente hereda el lector. Los informes JSON adjuntos registran estas verificaciones. La matriz dinámica sigue sin ejecutar, por las dos confirmaciones caducadas; este anexo no cambia ese límite.
