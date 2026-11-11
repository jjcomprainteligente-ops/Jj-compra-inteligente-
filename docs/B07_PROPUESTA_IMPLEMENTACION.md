# B07 · Propuesta concreta de cuentas y hogares

**Estado: propuesta para revisión, 11/11/2026. No hay servicio creado, conexión, migración, cuenta, invitación ni sincronización activada.** Este paquete no modifica la aplicación ni sus almacenes locales. Los contratos adjuntos describen lo que se implementaría y probaría después de aprobar la arquitectura.

## Decisión propuesta y motivo

Mantener Expo/React Native y el modo local actual. Añadir cuentas opcionales con **Supabase Auth + Postgres con RLS** como candidato, mediante una API de JJ que autentique cada petición y ejecute transacciones acotadas. Postgres encaja con el aislamiento por hogar y las pruebas RLS exigidas expresamente por B07. La API puede ejecutarse como Functions junto a la web; no exige convertir el frontend en Next.js.

Esto es una selección técnica propuesta, no una contratación ni una afirmación de disponibilidad o precio actual. Antes de crear recursos se comprobarán catálogo, región disponible, condiciones, cuotas, plan y proveedor de correo. No se promete un plan gratuito indefinido ni que una cuota de prueba cubra el piloto. Si ya existe una cuenta/proyecto del propietario, se inspeccionará su configuración segura antes de crear otro.

Primera versión compartida: **listas y productos básicos**, sin subir automáticamente recetas, dietas, notas, precios, gastos, presupuesto, favoritas o preferencias. La selección de datos a migrar se muestra antes de enviarlos. La compra y el pago continúan en el comercio externo.

## Por qué la activación necesita una decisión del propietario

[AGENTS.md, línea 18](../AGENTS.md#L18) establece: «**Sin servicios de pago, dependencias importantes, autenticación nueva ni arquitectura destructiva sin aprobación**».

El [bloque B07 original, línea 17](../referencias/gpt6-v2/extraidos/kit/JJ_Fase2_Codex_Kit/bloques/B07_HOGAR_Y_CUENTAS.md#L17) incluye como aceptación: «**Costes de servicio aprobados**». Su dependencia exige además esquema de privacidad validado. La elección de proveedor, tratamiento remoto y posibles costes no se deduce de haber autorizado una preview local en Vercel.

La aprobación que falta es concreta:

| Decisión | Propuesta a revisar | Pendiente de confirmar |
|---|---|---|
| Proveedor y titular | Proyecto del propietario; candidato Supabase Auth/Postgres y API de JJ | Cuenta/proyecto existente o creación autorizada; responsable de facturación y acceso administrativo |
| Región y datos | Región de base de datos en la UE, próxima al backend; listas básicas únicamente | Región disponible, contrato de tratamiento, subencargados y condiciones vigentes |
| Inicio de sesión | Correo con código de un solo uso como primera opción; sin redes sociales en esta entrega | Servicio de correo, cuotas/precio y configuración de remitente; no se envía ningún correo desde esta propuesta |
| Presupuesto | Plan y límites documentados antes de activar; alertas y límite operativo cuando el proveedor lo permita | Importe máximo aceptado y qué se desactiva al alcanzar límites; no prometer un corte de gasto inexistente |
| Retención y piloto | Borrado lógico inmediato para acceso; purga y caducidad de copias documentadas | Plazos acordados para tombstones, operaciones y backups; responsable del piloto |

No se piden contraseñas, tokens ni claves en el chat. La configuración aprobada se introduce en el proveedor/entorno seguro; únicamente los nombres de las variables y su disponibilidad se comprueban en la revisión.

## Estado actual que debe conservarse

La app no contiene autenticación ni cliente Supabase. Sus documentos viven en siete claves locales: compras, menús, comparaciones, observaciones, gastos, ajustes e idioma. `src/storage/writeCoordinator.ts` protege escrituras locales con snapshot, comparación del estado esperado, Web Locks/fence durable en web y cola por contexto en nativo. **No es un protocolo de sincronización entre dispositivos.**

`src/domain/dataPrivacy.ts` exporta por allowlist y `src/storage/dataPrivacy.ts` exige revisión, confirmación y estado esperado para borrar. Una copia de varios documentos es una doble lectura estable, no una transacción atómica conjunta. Pueden exportarse documentos corruptos/futuros como texto inerte; no deben reinterpretarse como una migración válida.

Compartir TXT envía una copia revisada, no crea membresías ni resuelve conflictos. No se cambiarán las siete claves o el fence actual para aparentar sincronización. Los datos del hogar y el estado de conexión necesitarán un espacio propio, versionado y separado por usuario/hogar, junto a su exportación, borrado y pruebas.

## Límites de confianza y sesiones

1. El cliente no decide su identidad, rol o pertenencia. El servidor verifica emisor, audiencia, firma y expiración de la sesión; Postgres evalúa `auth.uid()` y la membresía activa en cada acceso. Un `userId` o `householdId` enviado por el cliente nunca concede permisos.
2. La API de datos usa el contexto del usuario y RLS. **No usa una clave `service_role` para las operaciones ordinarias**, ni se distribuye una clave administrativa al cliente. Las operaciones administrativas inevitables, como eliminar la identidad propia, se aíslan y requieren autenticación reciente y comprobación del usuario objetivo en servidor.
3. Web: sesión en cookies `HttpOnly`, `Secure` y `SameSite`; cambios de estado requieren comprobación de origen y protección CSRF. No se guardan tokens en las siete claves existentes. Nativo: almacenamiento seguro del sistema mediante un adaptador aprobado; no AsyncStorage para secretos.
4. No se aceptan redirects arbitrarios de autenticación. Se registran explícitamente orígenes/deep links de prueba y producción, sin wildcard de previews. El hostname temporal de una preview no será una dirección estable para invitar a un hogar.
5. Logout revoca la sesión/refresh y la sesión de aplicación asociada. La autorización de datos debe consultar también una revocación de sesión, para no depender únicamente de que caduque un JWT ya emitido. Se prueba el acceso directo a RPC con un JWT de sesión cerrada; proteger solo la API de JJ no basta.
6. Logs sin cuerpos de listas, notas, correo completo, tokens, fragmentos de invitación o cookies. Los eventos mínimos usan IDs de operación y estados; los detalles de errores de proveedor no llegan directamente a la UI.

## Modelo de datos propuesto

Los nombres son de diseño, no tablas creadas. El esquema privado no se expone a clientes; las vistas/RPC públicas se conceden expresamente. En todas las tablas con datos de usuario se activa RLS y se revisa `FORCE ROW LEVEL SECURITY` donde corresponda. `anon` no tiene acceso a datos de hogares.

| Entidad | Campos y restricciones principales | Visibilidad / escritura |
|---|---|---|
| `account_controls` | Usuario, estado `active/deletion_pending/deleted`, época de sesión y trabajo de eliminación | Privado. Alta/renovación y autorización comprueban que la cuenta admite acceso. El cliente no escribe su estado. |
| `households` | `id uuid`, `name` acotado, `status active/deleting/deleted`, `revision bigint`, fechas del servidor | Miembro activo lee hogar activo. Crear, renombrar y eliminar mediante RPC autenticada. |
| `memberships` | PK `(household_id,user_id)`, `role owner/member`, `status pending/active/revoked`, `membership_epoch bigint`, fechas | No se puede escribir rol/estado desde el cliente. El hogar conserva exactamente un propietario activo mediante transacción y restricción revisada. |
| `shopping_lists` | `id uuid`, `household_id`, `name`, `revision`, `deleted_at`; FK al hogar | Miembros activos leen. Mutaciones por RPC con versión esperada y pertenencia actual. Borrado deja tombstone. |
| `shopping_items` | `id uuid`, `household_id`, `list_id`, `name`, `quantity_milli bigint`, `unit`, `category_code`, `checked`, `revision`, `deleted_at` | FK compuesta impide asociar un ítem a una lista de otro hogar. Cantidad entera positiva ≤1.000.000.000; `ud` exige múltiplos de 1.000; unidades `ud/g/kg/ml/L`. Categorías con códigos estables, no etiquetas traducidas. |
| `invitations` | `id`, hogar, emisor, `token_hash bytea unique`, caducidad, estado, `redeemed_by`, fecha de revocación | Token hash solo en esquema privado. Solo owner crea/revoca. Canjear no activa acceso sin aprobación del owner. |
| `ownership_transfers` | Hogar, owner emisor, miembro destinatario, caducidad, revisión esperada y estado; como máximo una transferencia pendiente por hogar | Proponer no cambia permisos. Aceptar exige destinatario activo, autenticación reciente, owner original aún vigente y transacción que conserve exactamente un owner. |
| `operation_receipts` | Clave única `(actor_id,scope_type,scope_id,idempotency_key)`, hash de payload, estado/resultado mínimo, revisión, fecha | Scope hogar exige membresía actual; scope cuenta solo admite la cuenta del actor. Nada de devolver resultados antiguos a una persona revocada. |
| `migration_batches` | Actor, hogar, review ID, idempotency key, estado, mapa de IDs/remotas, recuentos y hash del payload permitido | Solo actor y owner según alcance definido. No almacena un volcado de las siete claves locales. |
| `app_sessions` | Usuario, identificador de sesión autenticada, estado/revocación y caducidad | Privado. Registro/revocación controlados por servidor; las políticas de datos comprueban la sesión, además de la membresía. |
| `account_deletion_jobs` | Actor, recibo limitado, estado/pasos idempotentes, fechas y error operativo sin contenido privado | Privado. El recibo de eliminación solo permite consultar estado, no volver a leer datos. Purga y caducidad explícitas; no depende de una cascada que borre el trabajo a medio ejecutar. |

No se añade un rol administrador en la primera versión. Un miembro puede editar las listas compartidas, no invitar, revocar miembros, transferir propiedad ni eliminar el hogar. El owner no puede leer almacenes personales del teléfono de otros miembros ni sus gastos/recetas por pertenecer al mismo hogar.

## Políticas RLS y transacciones

Se propone `is_active_member(household_id)` como helper de autorización revisado. Debe comprobar usuario no nulo, cuenta activa, sesión de aplicación válida, hogar activo y membresía activa. Si necesita leer tablas privadas mediante `SECURITY DEFINER`, se fija `search_path`, se califican nombres, se limita `EXECUTE` y no se acepta un usuario arbitrario como parámetro. No se resuelve la recursión de una política desactivando RLS o abriendo tablas.

Las consultas de listas/ítems filtran por esta pertenencia, no por un rol almacenado en metadata editable del perfil ni por un dato del dispositivo. Las pruebas también acceden a PostgREST/RPC directamente, saltándose la UI y la API de JJ, para detectar permisos demasiado amplios.

Las escrituras directas `INSERT/UPDATE/DELETE` de membresías, invitaciones, recibos y tablas de negocio se revocan a `anon`/`authenticated`. Se concede solo el conjunto mínimo de RPC. Cada RPC vuelve a autenticar el actor, comprueba sesión y pertenencia actual, valida el hogar/relación del recurso y usa transacción. Las consultas de lectura admitidas siguen sujetas a RLS.

Una transacción de edición bloquea el hogar/membresía/lista relevantes en orden consistente, verifica `membership_epoch`, comprueba el recibo idempotente y la revisión esperada, aplica la mutación y guarda recibo/cambio en el mismo commit. Revocar un miembro bloquea esa misma membresía; una escritura anterior puede terminar antes de la revocación, pero ninguna escritura nueva se acepta después de que esta confirme. Un resultado de lectura ya entregado no puede retirarse físicamente del dispositivo.

Cada ítem tiene revisión propia; la lista tiene revisión de colección. Cambios en ítems diferentes pueden aceptarse si sus revisiones siguen vigentes. Dos cambios del mismo ítem con la misma revisión no se suman ni se pisan: uno confirma y el otro recibe conflicto con la versión actual. El usuario revisa y decide. Borrar una lista impide posteriores cambios de sus ítems y exige revisión de la colección.

Los tombstones y los identificadores de recursos eliminados impiden que una cola antigua recree un ítem con el mismo ID. Primera versión propuesta: mientras un hogar siga activo, conservar un registro mínimo de IDs eliminados sin nombres/notas/contenido; no se purga ese registro por caducar un recibo. Una purga posterior exige un protocolo de expiración de operaciones que rechace de forma determinista cualquier reintento anterior, probado antes de activarlo. Eliminar el hogar bloquea su namespace; crear otro genera un UUID nuevo en servidor, sin aceptar la reutilización del ID cerrado. Los plazos y el tratamiento de esta metadata se acuerdan antes de activar el servicio. Reingresar tras revocación produce una nueva época de membresía: una operación del periodo anterior no se reenvía automáticamente.

## Invitación de uso único, sin envíos desde esta propuesta

1. Owner autenticado solicita una invitación de rol `member`. El servidor comprueba límites, genera 32 bytes aleatorios seguros, almacena solo SHA-256 del token y propone TTL de 24 horas. Devuelve el token una vez; no aparece en logs ni en listados posteriores.
2. El enlace utiliza el origen estable aprobado y token en fragmento, no query. La app lo elimina de la barra antes de cargar recursos ajenos; ningún token va como referrer. No se usan URLs de preview temporal como invitaciones permanentes.
3. La persona inicia sesión, revisa qué hogar solicita y canjea el token. El servidor bloquea la fila de invitación y valida hash, TTL, emisor aún owner, hogar activo y estado. Marca el canje de forma atómica; crea una solicitud `pending`, sin permiso de leer listas.
4. El owner ve la cuenta solicitante con los datos mínimos necesarios y aprueba o rechaza. Solo una aprobación explícita activa la membresía. Así, reenviar accidentalmente el enlace no incorpora directamente a un tercero.
5. Dos canjes simultáneos producen como máximo una solicitud. Repetir un token consumido, revocado o caducado no da acceso ni revela el contenido del hogar. Revocar antes de aprobar invalida la solicitud pendiente.

La app no manda correos de invitación automáticamente. Una función futura de correo requiere su alcance y coste. El eventual correo de autenticación es otra configuración, iniciada por la persona al solicitar acceso y pendiente de aprobación del proveedor/remitente.

## Migración local, recuperación y modo desconectado

El inicio de sesión no sube datos por sí mismo. La persona elige hogar y listas, ve una proyección con recuentos y campos, y confirma. Por defecto solo salen título, nombre de producto, cantidad/unidad, categoría y marcado. Notas, precios y presupuesto siguen locales; no se pierden ni se presentan como migrados. Las siete claves y su fence no se borran, renombran o marcan como vacías al activar una cuenta.

La revisión fija un snapshot local y un ID de revisión. Antes de enviar se vuelve a comparar el estado local esperado; si cambió, se exige revisar de nuevo. El cliente genera IDs remotos y una clave idempotente estable para el lote. El servidor importa el lote aceptado de forma atómica dentro del límite acordado y devuelve mapa de IDs/revisión. Repetir la misma clave y payload devuelve el mismo recibo; cambiar payload con la misma clave devuelve conflicto.

Si se corta la respuesta después del commit, la UI muestra resultado pendiente de confirmar y consulta el recibo. No vuelve a importar con otra clave ni afirma que falló sin comprobarlo. Si el commit remoto confirmó pero guardar el mapa local falla, se conserva el lote pendiente y se recupera por el recibo. La copia local original permanece; una marca local de vínculo no equivale a eliminarla.

La cola offline pertenece a `(usuario,hogar,época de membresía)`, separada de las listas anónimas. Un cambio optimista se etiqueta «pendiente de guardar en el hogar» hasta confirmación. No se mezclan colas al cambiar de cuenta. Tras caducar sesión/pertenencia se renueva autorización antes de enviar; conflicto, revocación o resultado incierto conservan el borrador y bloquean el reenvío automático. Ninguna cola pendiente se vacía o elimina para aparentar éxito.

Las suscripciones/realtime son una mejora posterior a los contratos de lectura/escritura; no sustituyen autorización ni entrega durable. La primera implementación puede refrescar por revisiones/cursor, con paginación estable y tombstones. No se incluye contenido del hogar en notificaciones push sin otro alcance aprobado.

## Logout, exportación y borrado

| Acción | Resultado previsto |
|---|---|
| Cerrar sesión | Revocar sesión/refresh, detener suscripciones y apartar caché/cola del usuario. No borrar documentos anónimos anteriores ni enviar su cola bajo otra cuenta. Los cambios no confirmados se explican antes de descartar. |
| Salir o ser revocado del hogar | Nuevas lecturas/escrituras denegadas; caché del hogar se elimina del dispositivo cuando vuelve a ejecutar la app. No se puede garantizar borrar capturas o copias ya guardadas por la persona. |
| Exportar datos de cuenta/hogar | Alcance y permisos explícitos. Un miembro puede exportar los datos compartidos que puede leer; no tokens, hashes de invitación, sesiones o datos personales de otros miembros. El owner no obtiene por ello archivos locales ajenos. |
| Borrar copia local | Afecta al dispositivo/namespace seleccionado, no elimina el hogar remoto. La UI distingue ambas acciones. |
| Borrar cuenta de un miembro | Reautenticación reciente, revisión de membresías y resultado confirmado; elimina su identidad/datos personales según política. No borra compras compartidas ni datos de otros miembros por cascada accidental. |
| Borrar cuenta del único owner | Bloqueado hasta transferir propiedad y aceptación del receptor, o hasta confirmar expresamente la eliminación del hogar. No se deja un hogar sin owner ni se promociona a otro usuario automáticamente. |
| Eliminar hogar | Solo owner, reautenticación, resumen y confirmación explícita. Desactiva membresías/invitaciones y bloquea acceso en la misma transacción; la purga y los backups siguen plazos documentados. |

Las filas de listas/ítems no deben depender de `ON DELETE CASCADE` del creador a su identidad personal: eliminar la cuenta de quien creó un producto no debe borrar el trabajo del hogar. La atribución personal se elimina o seudonimiza cuando proceda, conservando integridad y las obligaciones de retención aprobadas.

Eliminar una identidad en Auth y modificar Postgres **no es una transacción atómica entre ambos servicios**. La precondición de propiedad, el bloqueo de cuenta y la creación del trabajo se confirman primero en Postgres. El estado `deletion_pending` impide crear hogares, renovar acceso o aceptar membresías mientras se completa el trabajo. Los pasos de retirada de membresías, tratamiento de atribución y eliminación en el proveedor son idempotentes y recuperables por recibo; si falla el proveedor no se afirma eliminación completada ni se restaura acceso automáticamente. Un recibo limitado de estado permite resolver una respuesta perdida sin devolver contenido de listas. Se prueba cada corte entre pasos y la creación concurrente de un hogar antes de cerrar este criterio.

## Entregas pequeñas propuestas

| Entrega | Cambio revisable | Aceptación necesaria |
|---|---|---|
| B07.1 · Contratos y pruebas locales | Tipos de permiso, proyección de migración, estados de cola y contratos; sin login de mentira | Validación, privacidad, invariantes y conflictos con fixtures; no se presenta como backend funcionando |
| B07.2 · Esquema aislado | Migraciones y RLS en base de QA desechable, sin datos personales | Matriz A/B/visitante/revocado ejecutada realmente y DML directo denegado |
| B07.3 · Cuenta opcional | Auth/API aprobadas, almacenamiento seguro de sesión, logout | Autenticación/CSRF/rate limits/redirects/renovación y sesión revocada; modo local independiente |
| B07.4 · Hogar e invitaciones | Crear hogar, invitación, solicitud/aprobación, revocación y transferencia | Un solo canje, rol mínimo, no acceso pendiente, carreras con revocación |
| B07.5 · Migración y lista compartida | Revisión de lote, vínculo seguro y operaciones idempotentes | Cortes antes/después de commit, mapas recuperables y datos locales intactos |
| B07.6 · Offline y privacidad | Cola por identidad/hogar, conflictos, exportar/salir/borrar | No resurrección ni cruce de cuentas; aceptación física y retención verificadas |

Se audita después de B07.1–2, B07.3–4 y B07.5–6. GitHub precede a la preview; los servicios y datos de prueba quedan separados de producción. Nunca se presenta una pantalla preparada como autenticación/sincronización real.

## Matriz mínima de pruebas ejecutables futuras

| Actor / situación | Comprobación | Esperado |
|---|---|---|
| Visitante sin sesión | SELECT/RPC por ID de hogar conocido | Denegado, sin metadatos de contenido |
| Miembro A / hogar A | Leer y editar ítem vigente | Solo A; revisión y recibo coherentes |
| Miembro A / hogar B | Cambiar ID de URL, payload, FK o RPC | Denegado aunque conozca UUID de B |
| Miembro A | Escribir owner/member, epoch o session por DML | Denegado |
| Invitado pending | Canjear y consultar listas antes de aprobación | Solicitud pendiente; sin acceso a listas |
| Dos personas con el mismo enlace | Canjear simultáneamente | Como máximo una solicitud; no dos membresías |
| Owner y miembro revocado | Escribir/canjear durante revocación | Orden transaccional definido; nada nuevo después del commit de revocación |
| Miembro revocado / JWT aún vigente | Pedir datos directamente a API y RPC | Denegado por membresía actual, no por una caché de UI |
| Sesión cerrada / JWT aún vigente | Reusar token contra RPC | Denegado por sesión de aplicación revocada |
| Dos dispositivos | Editar mismo ítem con revisión antigua | Un éxito y conflicto explícito; no suma ni overwrite silencioso |
| Dos dispositivos | Editar ítems diferentes | Cambios compatibles; cursor/revisiones sin pérdida |
| Offline y timeout | Commit remoto confirmado sin respuesta | Mismo recibo al reintentar, sin duplicados |
| Reintento mal formado | Misma idempotency key y payload diferente | Conflicto sin mutación |
| Cuenta cambiada/reingreso | Reenviar cola antigua o epoch anterior | Bloqueado; revisión/consentimiento nuevo |
| Migración | Fallo al guardar mapa local después de commit remoto | Recuperación por recibo; copia original intacta |
| Eliminación | Borrar cuenta de miembro o creador de un ítem | No borrar listas/ítems de los demás |
| Owner único | Borrar cuenta sin transferencia/eliminación de hogar | Bloqueado con salida explícita |
| Privacidad | Exportar/inspeccionar logs/errores | Sin tokens, hashes de invitación ni archivos de otros usuarios |

**Estado de esta matriz: diseñada, no ejecutada.** No se ha creado una base de QA ni se ha validado RLS contra Postgres desde este paquete. El JSON adjunto es un contrato de revisión, no una especificación de endpoints ya disponibles.

## Referencias y siguiente paso

- Código actual: `src/storage/writeCoordinator.ts`, `src/storage/writeFence.ts`, `src/domain/dataPrivacy.ts`, `src/storage/dataPrivacy.ts`, `src/domain/shopping.ts`.
- Contrato de revisión adjunto: [contracts.v1.json](../proposals/b07/contracts.v1.json).
- Referencias oficiales para comprobar al seleccionar/configurar el proveedor: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [Auth](https://supabase.com/docs/guides/auth), [precios vigentes](https://supabase.com/pricing). Este documento no contiene una cotización ni afirma haber verificado hoy un plan o región.

El siguiente paso es revisar y aprobar proveedor/proyecto, región y tratamiento de datos, método de acceso/correo y límite de gasto/retención. Hasta entonces se pueden implementar y probar los contratos locales de B07.1 y preparar migraciones en una rama aislada, manteniendo el modo local real y sin activar una cuenta ficticia en la app.
