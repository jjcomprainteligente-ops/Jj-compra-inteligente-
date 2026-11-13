import type { Page } from '@playwright/test';

/** DOM/computed-style audit. Does not retain page text, form values or user labels. */
export async function auditContrastAndTargets(page: Page, options: { includePassingSamples?: boolean } = {}) {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(includePassingSamples => {
    type Color = [number, number, number, number];
    const controls = 'button,a[href],input:not([type="hidden"]),textarea,select,[role="button"],[role="tab"],[role="checkbox"],[role="radio"],[role="switch"],[role="link"]';
    const textFailures: object[] = [], iconFailures: object[] = [], fieldBoundaryFailures: object[] = [], switchPaintFailures: object[] = [], nonTextReview: object[] = [], unsupported: object[] = [];
    const targetsBelow24: object[] = [], targetsBelow44: object[] = [], spacingExceptions: object[] = [];
    const exemptions = { disabled: 0, hidden: 0, transparentText: 0, textlessDecorations: 0 };
    const textSamples: object[] = [];
    const currentDialog = [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].filter(element => {
      const style = getComputedStyle(element), rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility === 'visible'
        && !element.closest('[hidden],[inert],[aria-hidden="true"]');
    }).at(-1);
    let textChecked = 0, iconsChecked = 0, fieldBoundariesChecked = 0;
    function descriptor(element: Element) {
      const scope = element.closest('[data-testid]');
      const chain: string[] = [];
      let current: Element | null = element;
      for (let depth = 0; current && depth < 6; depth++, current = current.parentElement) {
        const id = current.getAttribute('data-testid');
        if (id) { chain.unshift(`[data-testid=${JSON.stringify(id)}]`); break; }
        const parent: Element | null = current.parentElement;
        chain.unshift(current.tagName.toLowerCase() + (parent ? `:nth-child(${[...parent.children].indexOf(current) + 1})` : ''));
      }
      return { selector: chain.join(' > '), scope: scope?.getAttribute('data-testid') ?? null, role: element.getAttribute('role') ?? element.tagName.toLowerCase() };
    }
    function hidden(element: Element): boolean {
      if (currentDialog && !currentDialog.contains(element)) return true;
      if (element.closest('[hidden],[inert],[aria-hidden="true"]')) return true;
      const box = element.getBoundingClientRect();
      if (box.width < 0.1 || box.height < 0.1) return true;
      for (let current: Element | null = element; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) === 0) return true;
      }
      return false;
    }
    function disabled(element: Element) {
      return !!element.closest('[disabled],[aria-disabled="true"]');
    }
    function color(value: string): Color | null {
      if (value === 'transparent') return [0, 0, 0, 0];
      const match = value.match(/^rgba?\(([^)]+)\)$/);
      if (!match) return null;
      const values = match[1].replace(/\//g, ' ').split(/[\s,]+/).filter(Boolean);
      if (values.length < 3 || values.length > 4) return null;
      const rgb = values.slice(0, 3).map(part => part.endsWith('%') ? Number(part.slice(0, -1)) * 2.55 : Number(part));
      const alpha = values[3] === undefined ? 1 : values[3].endsWith('%') ? Number(values[3].slice(0, -1)) / 100 : Number(values[3]);
      return [...rgb, alpha].every(Number.isFinite) ? [rgb[0], rgb[1], rgb[2], alpha] : null;
    }
    function over(foreground: Color, background: Color): Color {
      const alpha = foreground[3] + background[3] * (1 - foreground[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      return [0, 1, 2].map(index => (foreground[index] * foreground[3] + background[index] * background[3] * (1 - foreground[3])) / alpha).concat(alpha) as Color;
    }
    function background(element: Element): Color | null {
      const chain: Element[] = [];
      for (let current: Element | null = element; current; current = current.parentElement) chain.unshift(current);
      let result: Color = [255, 255, 255, 1];
      for (const current of chain) {
        const style = getComputedStyle(current);
        if (style.backgroundImage !== 'none' || Number(style.opacity) < 0.999) return null;
        const parsed = color(style.backgroundColor);
        if (!parsed) return null;
        result = over(parsed, result);
      }
      return result;
    }
    function luminance(value: Color) {
      const channels = value.slice(0, 3).map(component => {
        const channel = component / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }
    function ratio(foreground: Color, back: Color) {
      const first = luminance(over(foreground, back)), second = luminance(back);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    }
    function inspectText(element: Element, foregroundValue: string, kind: string, opacity = 1) {
      const style = getComputedStyle(element), foreground = color(foregroundValue), back = background(element);
      if (!foreground || !back || opacity < 0.999) {
        unsupported.push({ ...descriptor(element), kind, reason: 'Unresolved CSS color, background image or group opacity' }); return;
      }
      if (foreground[3] === 0) { exemptions.transparentText++; return; }
      const fontSize = Number.parseFloat(style.fontSize);
      const weight = Number.parseFloat(style.fontWeight);
      const bold = weight >= 700 || (/bold/i.test(style.fontFamily) && !/semibold/i.test(style.fontFamily));
      const large = fontSize >= 24 || (bold && fontSize >= 56 / 3);
      const required = large ? 3 : 4.5, measured = ratio(foreground, back);
      textChecked++;
      const measurement = { ...descriptor(element), kind,
        ratio: Number(measured.toFixed(4)), required, foreground: foregroundValue,
        background: back.slice(0, 3).map(Math.round), fontSize, fontWeight: style.fontWeight, fontFamily: style.fontFamily };
      if (includePassingSamples) textSamples.push(measurement);
      if (measured + 1e-7 < required) textFailures.push(measurement);
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set<Element>();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement;
      if (!element || !node.textContent?.trim() || /^(SCRIPT|STYLE|SVG|PATH|INPUT|TEXTAREA)$/.test(element.tagName) || seen.has(element)) continue;
      if (hidden(element)) { exemptions.hidden++; continue; }
      if (disabled(element)) { exemptions.disabled++; continue; }
      const range = document.createRange(); range.selectNodeContents(node);
      if (![...range.getClientRects()].some(rect => rect.width > 0 && rect.height > 0)) continue;
      seen.add(element); inspectText(element, getComputedStyle(element).color, 'text');
    }
    for (const element of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea')) {
      if (element.tagName === 'INPUT' && /^(checkbox|radio|range|color|file|button|submit|reset|hidden)$/.test(element.getAttribute('type') ?? 'text')) continue;
      if (hidden(element)) continue;
      if (disabled(element)) { exemptions.disabled++; continue; }
      if (element.value) inspectText(element, getComputedStyle(element).color, 'input-value');
      else if (element.placeholder) {
        const placeholder = getComputedStyle(element, '::placeholder');
        inspectText(element, placeholder.color, 'placeholder', Number(placeholder.opacity));
      }
    }
    const active = [...document.querySelectorAll<HTMLElement>(controls)].filter(element =>
      !hidden(element) && !disabled(element) && !element.parentElement?.closest(controls));
    const targetRecords = active.map(element => ({ element, rect: element.getBoundingClientRect() }));
    for (const { element, rect } of targetRecords) {
      const style = getComputedStyle(element);
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName) && !/^(checkbox|radio|range|color|file|button|submit|reset|hidden)$/.test(element.getAttribute('type') ?? 'text')) {
        const inside = background(element), outside = element.parentElement ? background(element.parentElement) : null;
        if (inside && outside) {
          fieldBoundariesChecked++;
          const borderRatios = ['Top', 'Right', 'Bottom', 'Left'].flatMap(side => {
            const borderWidth = Number.parseFloat(style.getPropertyValue('border-' + side.toLowerCase() + '-width'));
            const borderStyle = style.getPropertyValue('border-' + side.toLowerCase() + '-style');
            const parsed = color(style.getPropertyValue('border-' + side.toLowerCase() + '-color'));
            return borderWidth > 0 && borderStyle !== 'none' && parsed ? [ratio(parsed, outside)] : [];
          });
          const fillRatio = ratio(inside, outside), strongestBoundary = Math.max(fillRatio, ...borderRatios);
          if (strongestBoundary + 1e-7 < 3) fieldBoundaryFailures.push({ ...descriptor(element), kind: 'editable-field-boundary',
            ratio: Number(strongestBoundary.toFixed(4)), required: 3, borderColors: [style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor],
            inside: inside.slice(0, 3).map(Math.round), outside: outside.slice(0, 3).map(Math.round) });
        } else unsupported.push({ ...descriptor(element), kind: 'editable-field-boundary', reason: 'Unresolved adjacent background' });
      }
      if (['checkbox', 'radio', 'switch'].includes(element.getAttribute('role') ?? '')) {
        const candidates = [element, ...element.querySelectorAll('*'),
          ...(element.tagName === 'INPUT' && element.parentElement ? [...element.parentElement.children].flatMap(sibling => [sibling, ...sibling.children]) : [])];
        const paint = [...new Set(candidates)].flatMap(candidate => {
          if (candidate instanceof SVGElement) return [];
          const computed = getComputedStyle(candidate), box = candidate.getBoundingClientRect();
          if (box.width < 1 || box.height < 1) return [];
          const own = background(candidate), adjacent = candidate.parentElement ? background(candidate.parentElement) : null;
          const border = Number.parseFloat(computed.borderTopWidth) > 0 ? color(computed.borderTopColor) : null;
          const fill = color(computed.backgroundColor);
          if ((!fill || fill[3] === 0) && !border) return [];
          return [{ ...descriptor(candidate), width: Number(box.width.toFixed(2)), height: Number(box.height.toFixed(2)),
            fill: computed.backgroundColor, border: computed.borderTopWidth + ' ' + computed.borderTopColor,
            fillAgainstParent: own && adjacent ? Number(ratio(own, adjacent).toFixed(4)) : null,
            borderAgainstParent: border && adjacent ? Number(ratio(border, adjacent).toFixed(4)) : null }];
        });
        nonTextReview.push({ ...descriptor(element), kind: 'state-indicator-boundary', appearance: style.appearance, paint,
          reason: 'State-indicator paint and focus outlines require separate review; text/icon contrast does not establish their conformance.' });
        if (element.getAttribute('role') === 'switch' && element.tagName === 'INPUT' && element.parentElement) {
          const outside = background(element.parentElement);
          const painted = [...element.parentElement.children].filter(sibling => sibling !== element).flatMap(sibling => {
            const value = color(getComputedStyle(sibling).backgroundColor), box = sibling.getBoundingClientRect();
            return value && value[3] > 0 && box.width >= 10 && box.height >= 10 ? [{ value, box }] : [];
          }).sort((a, b) => b.box.width * b.box.height - a.box.width * a.box.height);
          if (painted.length === 2 && painted[0].box.width > painted[1].box.width && outside) {
            const trackRatio = ratio(painted[0].value, outside), thumbRatio = ratio(painted[1].value, painted[0].value);
            if (trackRatio + 1e-7 < 3) switchPaintFailures.push({ ...descriptor(element), kind: 'custom-switch-track', ratio: Number(trackRatio.toFixed(4)), required: 3 });
            if (thumbRatio + 1e-7 < 3) switchPaintFailures.push({ ...descriptor(element), kind: 'custom-switch-thumb', ratio: Number(thumbRatio.toFixed(4)), required: 3 });
          } else unsupported.push({ ...descriptor(element), kind: 'custom-switch-paint', reason: 'Native/custom switch paint cannot be resolved as a track and thumb pair.' });
        }
      }
      const item = { ...descriptor(element), width: Number(rect.width.toFixed(2)), height: Number(rect.height.toFixed(2)) };
      if (rect.width + 0.1 < 44 || rect.height + 0.1 < 44) targetsBelow44.push(item);
      if (rect.width + 0.1 >= 24 && rect.height + 0.1 >= 24) continue;
      const center = { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
      const overlaps = targetRecords.some(other => {
        if (other.element === element) return false;
        const box = other.rect;
        if (box.width < 24 || box.height < 24) return Math.hypot(center.x - (box.left + box.right) / 2, center.y - (box.top + box.bottom) / 2) < 24 - 0.01;
        return Math.hypot(center.x - Math.max(box.left, Math.min(center.x, box.right)), center.y - Math.max(box.top, Math.min(center.y, box.bottom))) < 12 - 0.01;
      });
      if (overlaps) targetsBelow24.push(item); else spacingExceptions.push(item);
    }
    for (const element of active) {
      // Icons accompanied by visible text do not carry the control's identity alone.
      if (element.innerText.trim()) continue;
      for (const shape of element.querySelectorAll<SVGElement>('svg path,svg line,svg circle,svg polyline,svg rect,svg ellipse')) {
        const style = getComputedStyle(shape), back = background(shape);
        if (!back) { unsupported.push({ ...descriptor(element), kind: 'functional-icon', reason: 'Unresolved icon background' }); continue; }
        const paint = style.stroke !== 'none' ? style.stroke : style.fill;
        const foreground = color(paint);
        if (!foreground || foreground[3] === 0) continue;
        iconsChecked++;
        const measured = ratio(foreground, back);
        if (measured + 1e-7 < 3) iconFailures.push({ ...descriptor(element), ratio: Number(measured.toFixed(4)), required: 3, foreground: paint, background: back.slice(0, 3).map(Math.round) });
      }
    }
    return { textChecked, iconsChecked, fieldBoundariesChecked, activeControls: active.length, textFailures, iconFailures, fieldBoundaryFailures, switchPaintFailures, nonTextReview, textSamples,
      targetsBelow24, targetsBelow44, spacingExceptions, unsupported, exemptions,
      scope: 'Mounted DOM text/input placeholders, icon-only active controls and target geometry; ancestor solid backgrounds composited on a white canvas. No page text or form values retained. Group opacity/images remain unresolved; no physical-device or complete WCAG certification.' };
  }, options.includePassingSamples === true);
}
