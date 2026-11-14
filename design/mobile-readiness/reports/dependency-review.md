# Revisión de dependencias compatibles — 10 de noviembre de 2026

Repositorio examinado: `/workspace/jjcompraintelwgiemt`, base `936459d` (PR #3). Trabajo de solo lectura de código y dependencias. No se instalaron paquetes ni se modificaron `package.json`, `package-lock.json`, fuentes, pruebas o configuración. Este informe y la caché de consultas npm están fuera del repositorio.

## Dictamen

**No existe una actualización oficial compatible que elimine hoy los cinco avisos moderados.** Los rangos declarados por Expo continúan exigiendo las versiones mayores afectadas de glob y minimatch. No corresponde presentar como corrección el downgrade que sugiere `npm audit`, ni forzar mayores mediante overrides.

Se hizo una consulta nueva de `npm audit` y metadatos públicos con `--prefer-online --fetch-retries=0 --fetch-timeout=15000`, manteniendo TLS y el proxy heredado. El sandbox rechazó la conexión al proxy con EPERM; las mismas consultas de solo lectura se ejecutaron con escalación aprobada. La auditoría nueva terminó con su código 1 esperado por avisos existentes y declaró **5 moderados, 0 altos, 0 críticos, 0 bajos**.

## Versiones instaladas y rangos públicos verificados

| Paquete | Versión instalada / última permitida | Restricción relevante |
|---|---|---|
| expo | 58.0.23 / 58.0.23 para `~58.0.23` | CLI `^58.1.19`; fingerprint `^0.21.9` |
| @expo/cli | 58.1.19 / 58.1.19 para `^58.1.19` | glob `^13.0.0` |
| @expo/fingerprint | 0.21.9 / 0.21.9 para `^0.21.9` | glob `^13.0.0`; minimatch `^10.2.2` |
| glob | 13.0.7 / 13.0.7 para `^13.0.0` | minimatch `^10.2.2` |
| minimatch | 10.2.6 / 10.2.6 para `^10.2.2` | Sigue dentro del rango afectado |

Las versiones públicas actuales corregidas son **glob 14.0.4** (requiere minimatch `^11.0.5`) y **minimatch 11.0.5**. Sus motores admiten Node 24, pero eso no las hace compatibles con los rangos de dependencia oficiales anteriores. Pasar glob 13→14 y minimatch 10→11 excedería esos rangos. No se comprobó compatibilidad de API mediante un override porque no es una actualización admitida por el encargo.

## Avisos actuales

- glob: [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), cancelación AbortSignal que permite continuar recorrido de archivos después del timeout; rango afectado `>=9.0.0 <=14.0.1`.
- minimatch: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), posible denegación de servicio por amplificación de globparts; rango afectado `>=7.0.0 <11.0.1`.

Los cinco paquetes marcados son `glob`, `minimatch`, `@expo/cli`, `@expo/fingerprint` y `expo`: las tres últimas marcas son cadenas transitivas de estos dos avisos, no cinco vulnerabilidades independientes nuevas.

Las cadenas observadas pertenecen a herramientas de Expo CLI/fingerprint. No hay importaciones directas de glob o minimatch en `src`, `App.tsx` o `index.ts`. Esta observación no se usa para borrar avisos ni para afirmar ausencia de riesgo.

`npm audit` continúa proponiendo `expo 53.0.11` como solución con `isSemVerMajor:true`, una degradación de la plataforma actual. No debe aplicarse con `--force`.

## Próximo paso compatible

Conservar el lockfile y las versiones comprobadas; volver a evaluar cuando Expo publique versiones dentro de los rangos admitidos que adopten glob/minimatch corregidos. Si se considera una migración mayor o un parche propio, tratarlo como cambio de alcance con análisis y validación separados. Mientras tanto, avanzar en los flujos de iPhone y accesibilidad pendientes sin ocultar los cinco moderados.

## Comandos de comprobación

- `npm audit --json --fetch-retries=0 --fetch-timeout=15000`
- `npm view 'expo@~58.0.23' version dependencies --json --prefer-online`
- `npm view '@expo/cli@^58.1.19' version dependencies.glob dependencies.minimatch --json --prefer-online`
- `npm view '@expo/fingerprint@^0.21.9' version dependencies.glob dependencies.minimatch --json --prefer-online`
- `npm view 'glob@^13.0.0' version dependencies.minimatch --json --prefer-online`
- `npm view 'minimatch@^10.2.2' version --json --prefer-online`
- `npm view glob@latest version dependencies.minimatch engines --json --prefer-online`
- `npm view minimatch@latest version engines --json --prefer-online`

Todas las consultas usaron `npm_config_cache=/workspace/scratch/npm-cache`. No se leyó ni imprimió ninguna credencial y no se efectuó instalación, fix, update, override o commit.
