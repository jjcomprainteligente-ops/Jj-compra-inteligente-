# B06.2 · Referencias aproximadas de localidades de Tenerife

Revisión de fuentes y licencia: **26/11/2026**. Fuente: [GeoNames](https://www.geonames.org/),
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Los nombres y las coordenadas
proceden de GeoNames. Los cambios de esta adaptación consisten en seleccionar filas,
asociar explícitamente dos localidades a su CP y municipio, y generar IDs estables y un
catálogo TypeScript. La licencia permite compartir y adaptar con atribución e indicación
de los cambios; los originales conservan sus avisos completos.

Son **puntos aproximados de localidades**, con cobertura parcial. No son centroides
postales, domicilios exactos ni ubicaciones de establecimientos. No certifican distancias
por carretera, precios, existencias o comprobaciones sobre el terreno. GeoNames explica
que parte de sus coordenadas postales son estimaciones o promedios de localidades
vecinas. Esta adaptación no calcula promedios ni infiere coordenadas faltantes.

## Originales conservados y procedencia

- `postal-ES.zip`: original de `https://download.geonames.org/export/zip/ES.zip`, recibido
  con HTTP 200; 556.019 bytes; SHA-256
  `180d44a0609ce19f624e62e0f56f5f36e9d8a57673d6b47b5cf372c10061c1cc`.
  Contiene exactamente `readme.txt` y `ES.txt` (37.867 filas, 12 campos).
- `postal-readme.txt`: README postal original, idéntico al miembro del ZIP, con la
  licencia y la descripción de los métodos de estimación.
- `gazetteer-reviewed.tsv`: dos filas originales, sin cabecera ni cambios, extraídas
  del gazetteer español de `https://download.geonames.org/export/dump/ES.zip`.
  El ZIP completo no se publica aquí. Su tamaño (3.337.891 bytes), SHA-256
  `c139cfdbc434bc98086ab2a34d123d759c0b686fe7be38aeb6c69ae7174591d2` y recibo HTTP
  quedan registrados para trazabilidad; la reproducción local comprueba los hashes de
  las dos filas conservadas y del subconjunto, sin necesitar el archivo completo.
- `gazetteer-readme.txt`: README original del gazetteer, con esquema y licencia.
- `source-manifest.json`: recibos sin credenciales, tamaños y hashes fijados, reglas,
  asociaciones revisadas, filas retenidas, estadísticas y hash del derivado.

Los recibos incluyen la fecha de descarga y `Last-Modified` declarado por el servidor.
Esto no implica que cada punto se haya actualizado ese día. Las filas de Los Cristianos
y Los Gigantes declaran respectivamente **06/05/2015** y **01/02/2024** como fecha de
modificación. No se publican HTML de licencia, scripts descargados ni rutas privadas.

## Selección y límites

La fuente postal aporta **466 candidatas en 162 CP** con país ES, autonomía CN,
provincia TF y CP entre 38000 y 38699: 77 con calidad 1, 175 con calidad 3 y 214 con
calidad 4. Solo se activan filas de calidad 4 (`geonameid` según GeoNames), municipio
conocido entre los 31 códigos INE de Tenerife y punto dentro de latitud 27,98–28,65 /
longitud −16,95–−16,07. La calidad 4 no garantiza precisión domiciliaria.

Se conservan **207 referencias postales** y se retienen **259 filas**: 252 por calidad
distinta de 4; ocho por municipio ausente (siete son de calidad 4); cuatro de calidad 3
tienen además longitud −17,3237, fuera de Tenerife. Los motivos se solapan. Entre las
siete de calidad 4 sin municipio figura el aeropuerto Reina Sofía con un punto en
Santa Cruz; no se utiliza. No se completan municipios por suposición.

Se incorporan además dos puntos del gazetteer de clase **P/PPL**, con identidad, país,
autonomía 53, provincia TF y municipio comprobados contra la asociación postal explícita:

| Punto y GeoName ID | CP y asociación postal | Coordenada del punto | Fecha fuente |
| --- | --- | --- | --- |
| Los Cristianos · 2514741 | 38650 · Playa De Los Cristianos · Arona 38006 | 28.05011, −16.72008 | 2015-05-06 |
| Los Gigantes · 6692470 | 38683 · Acantilados De Los Gigantes · Santiago del Teide 38040 | 28.24361, −16.84153 | 2024-02-01 |

Las coordenadas de las filas postales de estas dos localidades siguen retenidas:
calidad 1 en Los Cristianos y 3 en Los Gigantes. El punto publicado procede del
gazetteer, sin trasladar suposición alguna desde aquellas coordenadas postales.

Resultado: **209 referencias, 129 CP y 29 municipios**. Hay 128 CP en las filas postales
activas; Los Gigantes añade un CP. Se preservan 43 coincidencias de coordenadas entre
registros; no se fusionan localidades o nombres distintos por compartir un punto.
Los códigos municipales 38018 y 38044 no tienen referencias activas en este lote;
no se completa esa cobertura por inferencia.
El ID postal contiene el CP y los primeros 16 caracteres del SHA-256 de la fila cruda
sin su LF final. `sourceId` conserva el hash completo. Los dos IDs del gazetteer usan
su GeoName ID y el CP; el manifiesto conserva también los hashes de sus filas crudas.

## Verificación del ámbito

La lista de 31 municipios se contrastó el 26/11/2026 con el
[Cabildo de Tenerife](https://www.tenerife.es/municipios) y la relación código/municipio
del [anexo I del BOE-A-2025-76](https://boe.es/buscar/doc.php?id=BOE-A-2025-76).
El ámbito provincial TF por sí solo incluye otras islas. La selección exige además
el municipio conocido, la referencia postal y los límites de coherencia geográfica;
un CP o el rectángulo de coordenadas por sí solos no prueban una ubicación en la isla.
El directorio autonómico también enumera los
[ayuntamientos de Tenerife](https://www.gobiernodecanarias.org/otros/ayuntamientos/ayto_tenerife/)
(«La Laguna» y «San Cristóbal de La Laguna» son dos nombres del mismo municipio).

## Reproducción sin red ni dependencias

Desde la raíz del repositorio:

```sh
python3 scripts/prepare-postal-references.py --check
python3 -m unittest discover -s tests/python -p 'test_postal_references.py'
python3 scripts/prepare-postal-references.py --output-dir /tmp/jj-postal-prepared-NUEVO
```

`--check` lee los cuatro originales fijados, valida hashes, esquema, CRC y límites,
reconstruye el catálogo y compara byte a byte el TypeScript y el manifiesto publicados.
No escribe archivos. `--output-dir` exige un directorio que todavía no exista, con
padre existente y fuera del repositorio; crea únicamente `postalReferences.ts` y
`source-manifest.json` preparados para revisión, sin sustituir archivos de la aplicación.

El lector limita el ZIP comprimido y la suma expandida a 8 MiB, exige dos miembros
exactos y ratio de compresión máximo 200, rechaza rutas alternativas, duplicados,
enlaces, directorios, cifrado y métodos de compresión ajenos a STORE/DEFLATE. No extrae
miembros al disco ni ejecuta código descargado. Valida UTF-8 estricto, 12/19 columnas,
50.000 filas postales como máximo, dos revisadas, 10.000 bytes por fila, fechas de
calendario, identidad única, coordenadas finitas y ámbito administrativo. El catálogo
permite como máximo 1.000 referencias. Los hashes fijados impiden que una modificación
silenciosa de los originales o sus recibos se convierta en una nueva fuente aprobada.
