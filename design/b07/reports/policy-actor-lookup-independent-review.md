# B07.2 · Addendum independiente: acceso al actor desde el lector RLS

11/11/2026. Revisión de código de solo lectura; este addendum es la única escritura del revisor. No ejecuté SQL remoto, modifiqué aplicación/pruebas/migraciones ni creé commits. Los resultados remotos siguientes fueron comunicados por el agente principal, que realizó las operaciones.

## Artefactos revisados

- `supabase/migrations/20261111190357_jj_policy_actor_lookup.sql`, 30 líneas, SHA-256 `8fb74ba1c327bcc0841769884fd480aa55c5bc6a7043f6c518162c2d6fbe2f94`. Misma corrección revisada antes de aplicar; nombre local alineado con historia remota `20261111190357`.
- `supabase/tests/policy_actor_lookup.sql`, 56 líneas, SHA-256 `a3f05f9ba5c44548e88706dce3171a9a66168dbfcaf11de8307fb5798ee6e1b3`.
- La matriz original `supabase/tests/household_security.sql` conserva SHA-256 `e8cc847184e641ea53663a8be34f921c0a66967cf6ec7dbef9dfbc422a1606d1`.

## Fallo real y causa

La primera ejecución efectiva de la matriz falló con SQLSTATE **42501, permiso denegado sobre schema `auth`**, en el helper exterior `can_read_household`. Esto sustituye cualquier expectativa estática previa de que el GRANT inicial fuera efectivo: la matriz detectó una dependencia que no estaba operativa.

La inspección real comunicada por el agente principal confirmó que `jj_policy_reader` no tenía USAGE en `auth`. `postgres` sí tenía USAGE, pero sin opción para otorgarlo; por tanto, el GRANT de la base no había conferido ese permiso al lector. Tras el fallo, los recuentos de Auth y de las 14 tablas JJ eran cero: las fixtures no quedaron persistidas.

## Corrección revisada

La migración añade `jj_private.jwt_actor_id()` sin parámetros, PL/pgSQL, SECURITY DEFINER, `search_path=''`. Devuelve únicamente `auth.uid()` y convierte un subject UUID malformado en NULL. EXECUTE se revoca expresamente a PUBLIC, anon, authenticated y service_role y se concede solo a `jj_policy_reader`.

El helper exterior se reemplaza conservando propietario y ACL existentes. Su única dependencia de actor pasa a ser ese puente privado; mantiene **`has_live_session() AND` hogar activo y membresía activa del actor**. El puente UUID no es autenticación ni autorización por sí mismo.

La corrección no concede al lector acceso al schema/tablas Auth, BYPASSRLS, pertenencia a authenticated ni nuevos permisos sobre tablas. Ahora hay dos helpers interiores privilegiados y acotados: el gate booleano de sesión y el puente UUID; el helper exterior sigue perteneciendo al rol NOLOGIN/NOBYPASSRLS. El agente principal comunica que comprobó esos propietarios y que PUBLIC/anon/authenticated/service_role carecen de EXECUTE sobre el puente.

**Sin hallazgos estáticos bloqueantes en esta corrección.** La decisión conserva un límite de privilegios más estrecho que abrir Auth al lector general. El GRANT histórico inefectivo no debe interpretarse como permiso real ni repararse ampliando roles para evitar el fallo.

## Evidencia del probe de solo lectura

`policy_actor_lookup.sql` usa BEGIN, SET LOCAL y parámetros de sesión locales, consulta funciones y catálogo, y termina en ROLLBACK. No inserta filas, usuarios, fixtures ni funciones. Comprueba el rol efectivo en el informe y ejecuta el puente como `jj_policy_reader`, que sigue sin USAGE Auth; luego consulta los permisos desde `authenticated`.

El agente principal comunica un informe real con las diez expectativas booleanas en true, USAGE Auth del lector en false y los dos roles efectivos esperados. Esa ejecución acredita que el lector obtiene el subject por el puente sin acceder directamente a Auth, que los casos vacíos/malformados consultados quedan denegados y que authenticated no hereda el lector ni tiene EXECUTE sobre el puente.

Dos límites de interpretación del código son relevantes:

1. El script **emite flags; no contiene aserciones que aborten si son falsos**. La evidencia positiva exige revisar los valores del JSON y los roles, como comunica haber hecho el agente principal; una respuesta SQL sin error no basta.
2. `missingProviderSessionDenied` llama a `can_read_household` con un hogar inexistente en una base vacía. Acredita denegación en ese contexto, pero no aísla por sí solo la ausencia de sesión como causa: también falta el hogar. No es un sustituto del caso con hogar/membresía existentes y sesión retirada de la matriz original.

El propio informe mantiene `fullHouseholdMatrixExecuted:false` y `authLoginOrJwtSignatureVerified:false`. Son límites correctos: los claims son parámetros de prueba, no JWT firmados ni un inicio de sesión real.

## Inventario y estado de aceptación

El agente principal comunica recuentos finales cero en Auth y las 14 tablas JJ, cero rutinas/relaciones temporales JJ persistidas, siete funciones privadas y propietarios/ACL de los tres helpers de lectura comprobados. También comunica diez INFO del proveedor por tablas privadas sin políticas de cliente, sin WARN/error de seguridad. Esas tablas continúan en default deny; no se deben añadir políticas públicas para silenciar dichos INFO.

La corrección está aplicada y la regresión de acceso al actor cuenta con evidencia real acotada. **B07.2 permanece abierto:** los dos intentos posteriores de ejecutar la matriz original volvieron a recibir confirmación nativa caducada y no produjeron resultados de esa matriz. La confirmación del propietario ya existe; el pendiente es la ejecución efectiva a través del control nativo, no otra autorización de producto.

Para cerrar B07.2 falta recibir el resultado real de la matriz original completa y comprobar su ROLLBACK/inventario posterior. No atribuir a este probe la matriz A/B, comportamiento de sesiones con fixtures existentes, mutaciones, carreras, login, firmas JWT o sincronización. La interfaz y las siete claves locales permanecen sin cambios y no se ha activado autenticación en la aplicación.
