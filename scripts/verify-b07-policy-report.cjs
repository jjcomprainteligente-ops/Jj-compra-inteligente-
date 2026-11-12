#!/usr/bin/env node
// Validate values, not the report's own success flag. No provider calls or writes.
const fs = require('node:fs');
const assert = require('node:assert/strict');

try {
  assert.equal(process.argv.length, 3);
  const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  assert.equal(report.suite, 'managed_auth_actor_lookup_read_only');
  assert.equal(report.tableWrites, false);
  assert.equal(report.fullHouseholdMatrixExecuted, false);
  assert.equal(report.authLoginOrJwtSignatureVerified, false);
  assert.equal(report.reader.runtimeRole, 'jj_policy_reader');
  assert.equal(report.reader.authSchemaUsage, false);
  assert.equal(report.client.runtimeRole, 'authenticated');
  const conditions = [
    report.reader.absentActorIsNull, report.reader.absentSessionDenied,
    report.reader.absentHouseholdDenied, report.subject.subjectAvailableWithoutAuthUsage,
    report.subject.missingProviderSessionDenied, report.malformed.invalidSubjectIsNull,
    report.malformed.invalidSubjectDenied, report.client.bridgeNotExecutable,
    report.client.readerNotInherited, report.client.missingActorDenied,
  ];
  assert.ok(conditions.every(value => value === true));
  console.log(JSON.stringify({ readOnlyRegressionPassed: true, conditions: conditions.length,
    fullHouseholdMatrixExecuted: false }));
} catch {
  console.error('B07 read-only policy report verification failed.');
  process.exitCode = 1;
}
