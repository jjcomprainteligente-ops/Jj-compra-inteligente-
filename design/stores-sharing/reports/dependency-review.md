# Revisión de dependencias — 11 de noviembre de 2026

Alcance de solo lectura en `/workspace/jjcompraintelwgiemt`, rama de trabajo `codex/tiendas-y-lista-compartida`, base de aplicación `338ba24`. La integración de tiendas y compartir listas sigue en curso por otros agentes. Esta revisión no cambia sus archivos, las dependencias, el lockfile ni el historial.

## Resultado vigente

La consulta nueva de `npm audit` registra **5 avisos moderados, 0 altos, 0 críticos, 0 bajos y 0 informativos**. El JSON completo de esta ejecución sí se conservó en `npm-audit.json`, junto a este informe. No se reutilizó el JSON del 9 o 10 de noviembre.

**No hay una actualización oficial compatible disponible que elimine estos avisos.** Los últimos parches admitidos por los rangos actuales siguen siendo los ya instalados. Se consultaron metadatos públicos nuevos con `--prefer-online`, sin instalar ni resolver una versión diferente dentro del proyecto.

| Paquete | Instalado / último admitido consultado | Dependencias relevantes |
|---|---|---|
| Expo | 58.0.23 / 58.0.23 para `~58.0.23` | CLI `^58.1.19`; fingerprint `^0.21.9` |
| `@expo/cli` | 58.1.19 / 58.1.19 | glob `^13.0.0` |
| `@expo/fingerprint` | 0.21.9 / 0.21.9 | glob `^13.0.0`; minimatch `^10.2.2` |
| glob | 13.0.7 / 13.0.7 | minimatch `^10.2.2` |
| minimatch | 10.2.6 / 10.2.6 | La rama 10 permanece afectada |

Las últimas versiones públicas consultadas son **glob 14.0.4** y **minimatch 11.0.7**. La segunda avanzó respecto de la consulta del día anterior; sigue fuera de `^10.2.2`. glob 14.0.4 requiere minimatch `^11.0.5`, que puede resolver 11.0.7. Ambas admiten el Node 24 del entorno, pero eso no establece compatibilidad con los rangos ni las APIs de las herramientas Expo actuales.

## Cadenas y avisos

- **glob**, [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4): cancelación con AbortSignal que permite continuar el recorrido del sistema de archivos tras un timeout. El rango informado es `>=9.0.0 <=14.0.1`.
- **minimatch**, [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249): posible denegación de servicio por amplificación de globparts. El rango informado es `>=7.0.0 <11.0.1`.

Los cinco paquetes marcados son glob, minimatch, Expo, CLI y fingerprint. Las marcas de Expo/CLI/fingerprint corresponden a las cadenas transitivas de los dos advisories anteriores; no son cinco vulnerabilidades nuevas independientes. No se encontraron referencias a glob/minimatch en `src`, `App.tsx` o `index.ts` mediante búsqueda de palabras completas. Las cadenas observadas pertenecen a las herramientas de Expo. Esto no se utiliza para ocultar avisos o afirmar ausencia de riesgo.

`npm audit` sigue proponiendo Expo **53.0.11**, con `isSemVerMajor: true`, como arreglo de la cadena. Sería una degradación de la plataforma actual; no se aplicó. Tampoco se usaron `--force`, overrides, parches propios o cambios mayores forzados.

## Evidencia y ejecución

El primer intento dentro del sandbox falló antes de obtener advisories: `connect EPERM` al proxy heredado. La misma consulta de solo lectura se repitió fuera del sandbox con escalación aprobada, conservando proxy y verificación TLS. El entorno observado fue el ejecutor `ccarenv_b64_Y2NhcmVudl8yNDcwODY0ODg5YTg4MTkxOGUxY2RiYzA0MmQxMzkyMw`, política HTTP unrestricted/enforced y observaciones actuales. No había secretos o identidades configurados en los metadatos del entorno. No se imprimió ninguna credencial.

Consulta de advisories:

```sh
npm audit --json --fetch-retries=0 --fetch-timeout=15000
```

Consultas de metadatos, todas con `--json --prefer-online --fetch-retries=0 --fetch-timeout=15000`:

```sh
npm view 'expo@~58.0.23' version dependencies
npm view '@expo/cli@^58.1.19' version dependencies.glob dependencies.minimatch
npm view '@expo/fingerprint@^0.21.9' version dependencies.glob dependencies.minimatch
npm view 'glob@^13.0.0' version dependencies.minimatch
npm view 'minimatch@^10.2.2' version
npm view glob@latest version dependencies.minimatch engines
npm view minimatch@latest version engines
```

Se utilizó `npm_config_cache=/workspace/scratch/npm-cache`. Las siete consultas de metadatos terminaron con código 0. `metadata-queries.json` identifica cada comando, hora y archivo de salida. `dependency-summary.json` incluye recuentos, versiones y huellas locales. `local-dependencies.json` conserva los valores instalados y sus ubicaciones de lockfile, incluida la CLI anidada bajo Expo.

Comprobación de conservación antes y después:

- `package.json`: SHA-256 `4db7ef8fae746d0ece0fb623e4b5d7187aeaeedc9ec7b9e0a2bf4b273db7304e`, idéntico.
- `package-lock.json`: SHA-256 `8fe986b5e120318f431e7d4c5602f8e55f639290a15a46f0e22e32c6ed059a42`, idéntico.

## Tratamiento

Conservar los cinco avisos como riesgos abiertos y seguir la publicación de versiones compatibles de Expo/CLI/fingerprint que adopten las ramas corregidas. Esta auditoría no autoriza ni ejecuta una migración mayor o un override. Se puede continuar la construcción y verificación de los flujos locales sin presentar las advertencias como resueltas. Las pruebas de aplicación, el análisis del código nuevo y la prueba física de iPhone son comprobaciones diferentes de este informe npm.
