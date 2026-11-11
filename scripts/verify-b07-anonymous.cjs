#!/usr/bin/env node
// Read-only probe of the provisioned project's Data API. It creates no users or rows.
// Role/claim database tests are separate; this does not certify a signed-in Auth flow.
const assert = require('node:assert/strict');

async function main() {
  const origin = process.env.JJ_SUPABASE_URL;
  const key = process.env.JJ_SUPABASE_PUBLISHABLE_KEY;
  assert.match(origin || '', /^https:\/\/[a-z0-9]{20}\.supabase\.co$/);
  assert.match(key || '', /^sb_publishable_[A-Za-z0-9_-]{20,200}$/);
  const checks = [];
  const tables = ['jj_households', 'jj_shopping_lists', 'jj_shopping_items'];
  for (const table of tables) {
    const response = await fetch(`${origin}/rest/v1/${table}?select=id&limit=1`, {
      method: 'GET', headers: { apikey: key, Accept: 'application/json' },
      redirect: 'error', signal: AbortSignal.timeout(15000),
    });
    const body = await response.json();
    assert.ok([401, 403].includes(response.status), `Anonymous read must be denied: ${table}`);
    assert.equal(body.code, '42501', `Expected a permission denial: ${table}`);
    checks.push({ check: `anonymous-cannot-read-${table}`, status: response.status, code: body.code });
  }
  const privateResponse = await fetch(`${origin}/rest/v1/account_controls?select=user_id&limit=1`, {
    method: 'GET', headers: { apikey: key, Accept: 'application/json', 'Accept-Profile': 'jj_private' },
    redirect: 'error', signal: AbortSignal.timeout(15000),
  });
  const privateBody = await privateResponse.json();
  assert.equal(privateResponse.status, 406, 'Private schema must not be exposed');
  assert.equal(privateBody.code, 'PGRST106', 'Expected an unexposed-schema denial');
  checks.push({ check: 'private-schema-not-exposed', status: privateResponse.status, code: privateBody.code });
  console.log(JSON.stringify({
    schemaVersion: 1, checkedAt: new Date().toISOString(), passed: true,
    scope: 'Real HTTP with a publishable key and no user JWT; GET only; no fixtures or user data.',
    signedInAuthVerified: false, checks,
  }, null, 2));
}
main().catch(() => { console.error('B07 anonymous HTTP verification failed; no credentials or response bodies logged.'); process.exitCode = 1; });
