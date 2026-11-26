import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { compileModsAsync, withPlugins, type ExportedConfig, type StaticPlugin } from 'expo/config-plugins';
import { getResolvedLocalesAsync } from '@expo/config-plugins/build/utils/locales';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const config: ExportedConfig = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
const languages = ['es', 'en', 'de', 'fr'] as const;
const reasonKey = 'NSLocationWhenInUseUsageDescription';
const nativeDirectoriesBefore = ['ios', 'android'].map(name => existsSync(new URL(`../${name}`, import.meta.url)));

interface Introspection {
  ios: {
    infoPlist: Record<string, unknown>;
    podfileProperties?: Record<string, unknown>;
  };
  android: {
    manifest: {
      manifest: { 'uses-permission'?: { $: { 'android:name': string } }[] };
    };
  };
}

function permissionNames(result: Introspection): string[] {
  return (result.android.manifest.manifest['uses-permission'] ?? []).map(entry => entry.$['android:name']);
}

async function introspect(includeLocation: boolean): Promise<Introspection> {
  const copy = structuredClone(config);
  if (!includeLocation) {
    copy.plugins = copy.plugins?.filter(plugin => (Array.isArray(plugin) ? plugin[0] : plugin) !== 'expo-location');
  }
  copy._internal = { projectRoot };
  const plugins = (copy.plugins ?? []).map(plugin => {
    if (typeof plugin === 'string') return plugin;
    if (!plugin[0]) throw new Error('Native plugin name is required.');
    return [plugin[0], plugin[1]] satisfies StaticPlugin;
  });
  // Expo's introspection providers evaluate configuration without writing
  // native projects or executing any device-location/permission API.
  const compiled = await compileModsAsync(withPlugins(copy, plugins), {
    projectRoot, platforms: ['ios', 'android'], introspect: true, ignoreExistingNativeFiles: true,
  });
  const result = compiled._internal?.modResults;
  if (!result?.ios?.infoPlist || !result?.android?.manifest) throw new Error('Native permission introspection unavailable.');
  return result as Introspection;
}

describe('foreground-only native location configuration', () => {
  let configured: Introspection;
  let withoutLocation: Introspection;

  beforeAll(async () => {
    configured = await introspect(true);
    withoutLocation = await introspect(false);
  });

  it('preserves the approved app identity, platforms, theme and four supported languages', () => {
    expect(config.name).toBe('JJ Compra Inteligente');
    expect(config.slug).toBe('jjcompraintelwgiemt');
    expect(config.ios?.bundleIdentifier).toBe('com.jjcompra.inteligente');
    expect(config.ios?.supportsTablet).toBe(true);
    expect(config.android?.package).toBe('com.jjcompra.inteligente');
    expect(config.backgroundColor).toBe('#FFF8E7');
    expect(config.web?.themeColor).toBe('#103F2D');
    expect(config.plugins).toContainEqual(['expo-localization', { supportedLocales: [...languages] }]);
    expect(configured.ios.infoPlist.CFBundleLocalizations).toEqual([...languages]);
  });

  it('uses Spanish as the native development fallback and a foreground reason from the Spanish resource', async () => {
    const { localesMap } = await getResolvedLocalesAsync(projectRoot, config.locales ?? {}, 'ios');
    expect(configured.ios.infoPlist.CFBundleDevelopmentRegion).toBe('es');
    expect(configured.ios.infoPlist[reasonKey]).toBe(localesMap.es[reasonKey]);
    expect(withoutLocation.ios.infoPlist).not.toHaveProperty(reasonKey);
  });

  it('generates no always, motion, temporary-precision or background-location declaration on iOS', () => {
    for (const key of [
      'NSLocationAlwaysUsageDescription', 'NSLocationAlwaysAndWhenInUseUsageDescription',
      'NSMotionUsageDescription', 'NSLocationTemporaryUsageDescriptionDictionary',
    ]) expect(configured.ios.infoPlist).not.toHaveProperty(key);
    expect(configured.ios.infoPlist.UIBackgroundModes ?? []).not.toContain('location');
    expect(configured.ios.podfileProperties?.['expo.location.motionActivityEnabled']).toBe('false');
  });

  it('adds only coarse and fine location permissions to the existing Android configuration', () => {
    const previous = new Set(permissionNames(withoutLocation));
    const permissions = permissionNames(configured);
    expect(permissions.filter(name => !previous.has(name)).sort()).toEqual([
      'android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION',
    ]);
    for (const name of previous) expect(permissions).toContain(name);
    // This evaluates the app/config plugins, not Android's dependency-manifest
    // merger. Expo Location also ships unexported service classes; no runtime
    // background/watch API is enabled or exercised by these checks.
  });

  it('resolves four distinct iOS permission resources through Expo’s actual locale-file loader', async () => {
    expect(Object.keys(config.locales ?? {}).sort()).toEqual([...languages].sort());
    const { localesMap } = await getResolvedLocalesAsync(projectRoot, config.locales ?? {}, 'ios');
    expect(Object.keys(localesMap).sort()).toEqual([...languages].sort());
    const descriptions = languages.map(language => {
      expect(Object.keys(localesMap[language])).toEqual([reasonKey]);
      const description = localesMap[language][reasonKey];
      expect(typeof description).toBe('string');
      expect(description).toContain('JJ Compra Inteligente');
      expect(description.length).toBeGreaterThan(80);
      expect(description.length).toBeLessThan(260);
      expect(description).not.toMatch(/[\p{C}<>]/u);
      return description;
    });
    expect(new Set(descriptions).size).toBe(4);
  });

  it('keeps the iOS usage descriptions out of Android string resources', async () => {
    const { localesMap } = await getResolvedLocalesAsync(projectRoot, config.locales ?? {}, 'android');
    expect(Object.values(localesMap)).toEqual(languages.map(() => ({})));
  });

  it('does not create native project directories while checking configuration', () => {
    expect(['ios', 'android'].map(name => existsSync(new URL(`../${name}`, import.meta.url)))).toEqual(nativeDirectoriesBefore);
  });
});
