# B06.2 · Zona de compra y distancias en Tenerife

Estado: integración construida; cierre de pruebas y publicación en curso. Fecha de preparación: 26/11/2026.
Continúa B06.1 sobre la aplicación existente. No inicia B07 ni sustituye los bloques históricos con numeración similar.

## Revisión de compatibilidad durante el cierre

La CI del primer origen `6c6eb48` pasó reproducción de fuentes, Python, tipos, 2.358 unitarias y auditoría,
pero la recomendación online de Expo cambió el 26/11 y bloqueó la compatibilidad: pidió Expo `~58.1.0`
y Expo Location `~58.0.23`. Se actualizan esas dos dependencias existentes y su lockfile, sin scripts de instalación.
La versión nueva de fingerprint reintrodujo `minimatch` afectado por
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).
Se traslada la corrección acotada del proyecto a `@expo/fingerprint@0.22.0 → minimatch 11.0.8`.
El consumidor real de fingerprint supera 24 comprobaciones de patrones; npm audit vuelve a cero avisos
y la comprobación oficial online de Expo pasa. No se desactiva ni reduce ningún control de CI.
Se conservan los intentos previos y se repiten las exportaciones y pruebas de navegador de la versión actualizada.

## Comportamiento

Perfil → Mis tiendas y el selector del recorrido de compra comparten una zona opcional durante la sesión.
La búsqueda manual permite CP español o localidad/municipio de Tenerife. Los resultados exigen elegir una
referencia explícita, incluso cuando solo aparece una. Un CP ambiguo no se convierte automáticamente
en un domicilio ni en un punto medio. Los radios son 5, 10, 20 o un entero de 1–100 km.
Cambiar el radio conserva el punto consultado; no vuelve a solicitar ubicación.

La distancia es aproximada, en línea recta, ordenada por distancia e ID; no es ruta, tiempo de viaje,
stock, precio ni clasificación de la cesta más barata. Las fichas fuera del radio se consultan por separado.
Las fichas pendientes conservan su advertencia y nunca reciben kilómetros. El usuario puede continuar
sin zona o sin seleccionar tiendas. Surtido, precios, entrega y promociones pueden variar por sucursal,
municipio, canal e isla; el formulario lo advierte en es/en/de/fr.

El catálogo sigue siendo parcial: seis fichas oficiales de B06.1, cinco puntos publicados y uno pendiente.
No se han añadido establecimientos por inferencia. ALDI y Mercadona permanecen seleccionables mediante
sus destinos oficiales aunque este lote no contenga fichas revisadas de esas modalidades.

## Datos y reproducción

[Referencias y licencia](../../referencias/geografia/B06_2/README.md): 209 referencias aproximadas,
129 CP y 29 municipios, de las cuales 207 son filas postales de calidad 4 con municipio conocido y dos
son puntos P/PPL contrastados de Los Cristianos y Los Gigantes. Los originales, hashes, asociaciones y
exclusiones permanecen disponibles. La calidad de fuente no acredita precisión domiciliaria.

Las filas estimadas, con municipio ausente o fuera de los límites de coherencia quedan inactivas.
Se conservan localidades distintas con coordenadas iguales. Dos municipios no tienen referencias activas;
el prefijo provincial TF incluye otras islas y no se utiliza por sí solo para acreditar Tenerife.

```sh
python3 scripts/prepare-postal-references.py --check
python3 -m unittest discover -s tests/python -p 'test_postal_references.py'
npm run typecheck
npm test -- --maxWorkers=2
```

La CI reproduce el catálogo. El importador no usa red ni dependencias externas y no extrae ni ejecuta
el ZIP. Valida límites, CRC, hashes, esquema, codificación, municipios y coordenadas. `--check` no escribe;
un nuevo derivado se prepara solo en un destino nuevo, sin sobrescribir la aplicación.

## Ubicación voluntaria y privacidad

El botón explica la consulta antes de abrir el permiso del sistema. Web exige un contexto seguro;
iOS/Android usa Expo Location compatible con el SDK instalado y permiso de primer plano. No se usan
observadores, tareas de ubicación ni permisos de segundo plano. No se solicita ubicación al abrir una pantalla.
El idioma de la explicación en la aplicación sigue la preferencia manual; el diálogo nativo depende
del idioma de la aplicación/sistema en iOS. Se incluyen descripciones es/en/de/fr y respaldo nativo español.

El límite de 15 segundos abarca carga, permiso y posición. Cancelar, cambiar manualmente la zona,
borrar datos o abandonar el formulario invalida respuestas tardías antes de leer sus coordenadas.
También se comprueban antigüedad, precisión declarada, valores finitos y ámbito geográfico.
Una consulta aceptada es un punto consultado, sin seguimiento continuo. La precisión indicada procede del dispositivo.

La zona no entra en AsyncStorage, localStorage, URL, copias, exportaciones, registros, telemetría ni
servidores de JJ. El proveedor es por instancia. Recargar, borrar zona, desmontar el proveedor o terminar
la sesión elimina ese contexto. Un borrado de datos confirmado también lo limpia. Listas, favoritos,
presupuestos, menús V1/V2 y sus siete claves anteriores conservan sus contratos.

## Verificación y límites

La [auditoría de la pareja](AUDITORIA_B06_1_B06_2.md) separa pruebas terminadas, publicación y aceptación.
La evidencia de preparación se registrará en `design/store-geography/reports/local-preparation.json`.
Las capturas y los datos ficticios de QA quedan fuera de Git y del paquete público.

Las exportaciones iOS/Android y la introspección de permisos no son aplicaciones firmadas ni pruebas
en dispositivos físicos. El manifiesto Android fusionado y el binario iOS de distribución necesitan
su auditoría nativa: el SDK declara dos servicios internos no exportados aunque no se habiliten permisos
de seguimiento; la plantilla Expo conserva configuraciones de desarrollo heredadas, incluido ATS amplio.
Nada de ello acredita seguimiento activo ni sustituye verificar el binario final. Pruebas de VoiceOver,
TalkBack, Dynamic Type, permisos reales y aceptación visual del propietario siguen pendientes.

No se conectan precios, bases de datos, cuentas ni IA. No se cambian el logo, Manrope, las recetas,
sus fotos, los tokens aprobados ni las fuentes comerciales históricas desactivadas.
