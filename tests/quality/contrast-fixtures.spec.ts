import { expect, test } from '@playwright/test';
import { auditContrastAndTargets } from './contrast';

test('known WCAG color ratios and large-text thresholds', async ({ page }) => {
  await page.setContent(`<body style="background:white;font:16px Arial;color:black">
    <div data-testid="black">Sample</div>
    <div data-testid="gray-fail" style="color:#777">Sample</div>
    <div data-testid="gray-pass" style="color:#767676">Sample</div>
    <div data-testid="red-small" style="color:red">Sample</div>
    <div data-testid="red-large" style="color:red;font-size:24px">Sample</div>
    <button data-testid="disabled" disabled style="color:#aaa;background:white">Sample</button>
    <div data-testid="alpha" style="color:rgba(0,0,0,.5)">Sample</div>
  </body>`);
  const result = await auditContrastAndTargets(page, { includePassingSamples: true });
  const values = result.textSamples as { scope: string; ratio: number; required: number }[];
  expect(values.find(value => value.scope === 'black')?.ratio).toBe(21);
  expect(values.find(value => value.scope === 'gray-fail')?.ratio).toBeCloseTo(4.4781, 3);
  expect(values.find(value => value.scope === 'gray-pass')!.ratio).toBeGreaterThanOrEqual(4.5);
  expect(values.find(value => value.scope === 'red-small')?.ratio).toBeCloseTo(3.9985, 3);
  expect(values.find(value => value.scope === 'red-large')?.required).toBe(3);
  expect((result.textFailures as { scope: string }[]).map(value => value.scope).sort()).toEqual(['alpha', 'gray-fail', 'red-small']);
  expect(result.exemptions.disabled).toBeGreaterThan(0);
  expect(result.unsupported).toEqual([]);
});

test('icon paint uses the immediate child background and input borders are tested separately', async ({ page }) => {
  await page.setContent(`<body style="background:white;color:black;font:16px Arial">
    <button data-testid="green" style="width:44px;height:44px;margin:20px;background:white;border:0"><span style="display:block;background:#006400"><svg width="20" height="20"><path d="M1 1L18 18" stroke="white" fill="none"/></svg></span></button>
    <button data-testid="white" style="width:44px;height:44px;margin:20px;background:white;border:0"><svg width="20" height="20"><path d="M1 1L18 18" stroke="white" fill="none"/></svg></button>
    <input data-testid="field-fail" style="color:black;background:white;border:1px solid #ddd" value="Sample">
    <input data-testid="field-pass" style="color:black;background:white;border:1px solid #777" value="Sample">
  </body>`);
  const result = await auditContrastAndTargets(page);
  expect((result.iconFailures as { scope: string }[]).map(value => value.scope)).toEqual(['white']);
  expect((result.fieldBoundaryFailures as { scope: string }[]).map(value => value.scope)).toEqual(['field-fail']);
});

test('small target overlap fails while measured spacing and 44px controls remain distinct', async ({ page }) => {
  await page.setContent(`<body style="background:white;color:black;font:16px Arial">
    <button data-testid="near-a" style="position:absolute;left:0;top:0;width:20px;height:20px;padding:0">A</button>
    <button data-testid="near-b" style="position:absolute;left:22px;top:0;width:20px;height:20px;padding:0">B</button>
    <button data-testid="spaced" style="position:absolute;left:100px;top:0;width:20px;height:20px;padding:0">C</button>
    <button data-testid="large" style="position:absolute;left:200px;top:0;width:44px;height:44px;padding:0">D</button>
  </body>`);
  const result = await auditContrastAndTargets(page);
  expect((result.targetsBelow24 as { scope: string }[]).map(value => value.scope).sort()).toEqual(['near-a', 'near-b']);
  expect((result.spacingExceptions as { scope: string }[]).map(value => value.scope)).toEqual(['spaced']);
  expect((result.targetsBelow44 as { scope: string }[]).map(value => value.scope)).not.toContain('large');
});

test('unresolved images and group opacity are reported instead of being treated as passing', async ({ page }) => {
  await page.setContent(`<body style="background:white;font:16px Arial;color:black">
    <div data-testid="opacity" style="opacity:.5">Sample</div>
    <div data-testid="gradient" style="background:linear-gradient(red,blue)">Sample</div>
  </body>`);
  const result = await auditContrastAndTargets(page);
  expect((result.unsupported as { scope: string }[]).map(value => value.scope).sort()).toEqual(['gradient', 'opacity']);
  expect(result.textChecked).toBe(0);
});

test('custom switch track and thumb require their actual sibling-paint contrast', async ({ page }) => {
  const control = (name: string, track: string, thumb: string) => `<div style="position:relative;width:44px;height:44px;margin:20px">
    <div style="position:absolute;top:7px;width:44px;height:30px;background:${track}"></div>
    <div style="position:absolute;top:12px;left:20px;width:20px;height:20px;background:${thumb}"></div>
    <input data-testid="${name}" type="checkbox" role="switch" style="position:absolute;appearance:none;width:44px;height:44px;border:0;margin:0;background:transparent">
  </div>`;
  await page.setContent('<body style="background:white">' + control('on', '#167347', 'white')
    + control('off', '#566b5f', 'white') + control('bad-thumb', '#167347', '#009688') + control('bad-track', '#ddd', 'white') + '</body>');
  const result = await auditContrastAndTargets(page);
  expect((result.switchPaintFailures as { scope: string; kind: string }[]).map(value => [value.scope, value.kind])).toEqual([
    ['bad-thumb', 'custom-switch-thumb'], ['bad-track', 'custom-switch-track'], ['bad-track', 'custom-switch-thumb'],
  ]);
});
