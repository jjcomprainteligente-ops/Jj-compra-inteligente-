# B07 | Cuentas, hogares y sincronización
**Estado inicial:** PENDIENTE | **Dependencia:** B04 aprobado y esquema de privacidad validado.
**Objetivo:** compartir una lista sin exponer datos a otros hogares.

## Encargo a Codex
1. Auditar si ya existe auth/sincronización antes de proponer Supabase.
2. Definir migración segura de lista local a cuenta y acceso por hogar.
3. Implementar permisos mínimos, invitación/revocación, resolución de conflictos y modo desconectado.
4. Habilitar borrado/exportación de datos y políticas de privacidad de forma validada.
5. Probar acceso cruzado entre hogares, políticas RLS donde aplique y pérdida/reintento de red.

## Aceptación
- [ ] Sin acceso de usuario A a datos del hogar B.
- [ ] Migración local no duplica ni elimina ítems silenciosamente.
- [ ] Invitaciones revocables.
- [ ] Política de borrado/protección verificada.
- [ ] Costes de servicio aprobados.
