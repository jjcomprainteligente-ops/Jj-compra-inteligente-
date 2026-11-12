-- Read-only regression for the managed Auth schema permission failure.
-- No table writes, fixtures, functions or users are created. SET LOCAL and the
-- custom report settings disappear at ROLLBACK. This is not the household matrix.
begin;
set local statement_timeout = '5s';
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', '', true);
select set_config('request.jwt.claims', '{}', true);

set local role jj_policy_reader;
select set_config('jj_test.reader', jsonb_build_object(
  'runtimeRole', current_user,
  'authSchemaUsage', has_schema_privilege(current_user, 'auth', 'USAGE'),
  'absentActorIsNull', jj_private.jwt_actor_id() is null,
  'absentSessionDenied', not jj_private.has_live_session(),
  'absentHouseholdDenied', not jj_private.can_read_household('10000000-0000-4000-8000-000000000001')
)::text, true);

select set_config('request.jwt.claims', jsonb_build_object(
  'sub', '20000000-0000-4000-8000-000000000002',
  'session_id', '30000000-0000-4000-8000-000000000003',
  'role', 'authenticated', 'exp', floor(extract(epoch from clock_timestamp())) + 3600
)::text, true);
select set_config('jj_test.subject', jsonb_build_object(
  'subjectAvailableWithoutAuthUsage', jj_private.jwt_actor_id() = '20000000-0000-4000-8000-000000000002'::uuid,
  'missingProviderSessionDenied', not jj_private.can_read_household('10000000-0000-4000-8000-000000000001')
)::text, true);

select set_config('request.jwt.claims', '{"sub":"invalid-uuid","role":"authenticated"}', true);
select set_config('jj_test.malformed', jsonb_build_object(
  'invalidSubjectIsNull', jj_private.jwt_actor_id() is null,
  'invalidSubjectDenied', not jj_private.can_read_household('10000000-0000-4000-8000-000000000001')
)::text, true);
reset role;

select set_config('request.jwt.claims', '{}', true);
set local role authenticated;
select set_config('jj_test.client', jsonb_build_object(
  'runtimeRole', current_user,
  'bridgeNotExecutable', not has_function_privilege(current_user, 'jj_private.jwt_actor_id()', 'EXECUTE'),
  'readerNotInherited', not pg_has_role(current_user, 'jj_policy_reader', 'MEMBER'),
  'missingActorDenied', not jj_private.can_read_household('10000000-0000-4000-8000-000000000001')
)::text, true);
reset role;

select jsonb_build_object(
  'suite', 'managed_auth_actor_lookup_read_only',
  'tableWrites', false,
  'fullHouseholdMatrixExecuted', false,
  'authLoginOrJwtSignatureVerified', false,
  'reader', current_setting('jj_test.reader')::jsonb,
  'subject', current_setting('jj_test.subject')::jsonb,
  'malformed', current_setting('jj_test.malformed')::jsonb,
  'client', current_setting('jj_test.client')::jsonb
) as report;
rollback;
