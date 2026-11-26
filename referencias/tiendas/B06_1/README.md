# B06.1 · Referencias de establecimientos de Tenerife

**Comprobación: 26/11/2026. Cobertura parcial: seis referencias, cuatro de las seis modalidades piloto, cinco ubicaciones publicadas y una pendiente por incoherencia de fuente.** Este paquete corresponde al Bloque 06 geográfico del plan maestro. No sustituye ni reescribe la auditoría histórica de precios llamada también B06.1.

El [manifiesto de procedencia](source-manifest.json) recoge los hechos mínimos extraídos de seis fichas oficiales individuales que respondieron HTTP 200. Identifica URL solicitada/final, fecha UTC de consulta, tipo, tamaño y SHA-256 del HTML conservado en evidencia privada. La [proyección estática de la app](../../../src/data/storeEstablishments.ts) mantiene las mismas identidades y estados. La consulta de una ficha comprueba lo que publica la cadena; no es una visita física, certificación geodésica o garantía de apertura actual.

## Referencias incluidas

| ID estable | Modalidad | Establecimiento | Estado de ubicación |
|---|---|---|---|
| `lidl-santa-cruz-general-sur` | Lidl | Ctra. General del Sur, Santa Cruz de Tenerife | Publicada en JSON-LD oficial. |
| `lidl-santiago-quinto-centenario` | Lidl | Avda. Quinto Centenario, Santiago del Teide | Publicada en JSON-LD oficial. |
| `dinosol-231` | HiperDino | Los Venezolanos, San Cristóbal de La Laguna | Publicada en el elemento de mapa de esa ficha. |
| `dinosol-166` | SuperDino | Gigansol, Santiago del Teide | Publicada en el elemento de mapa de esa ficha. |
| `dinosol-11` | HiperDino Express | Delfín, Santiago del Teide | Publicada en el elemento de mapa de esa ficha. |
| `dinosol-162` | SuperDino | Los Gigantes, Santiago del Teide | **Pendiente: `conflicting-source`.** |

No hay referencias actuales comprobadas de ALDI o Mercadona en este lote. Cero registros aquí **no significa que esas cadenas no tengan establecimientos** en Tenerife. Las seis modalidades del selector siguen siendo distintas; no se sustituye la selección de cadena/formato ni sus favoritos guardados por identificadores de sucursal. Este lote no es el inventario completo de ninguna cadena o de la isla.

## Extracción y coherencia

Para Lidl se leyó el objeto `GroceryStore` del JSON-LD de cada ficha: nombre, dirección y `geo`. Para HiperDino, SuperDino y Express se revisaron el encabezado de la ficha, su primera dirección y `data-lat`/`data-lon` del contenedor cuyo `data-store` coincide con el ID solicitado. Las opciones globales de un selector, otras tiendas, cabeceras y pies de página no acreditan la localización de ese establecimiento.

Solo se separan localidades expresamente publicadas. Cuando falta ese dato queda `null`; no se deriva de coordenadas, del nombre de la tienda o del código postal. En el segundo Lidl la localidad conserva el texto publicado `Santiago del Teide (Tenerife)`; el municipio elimina únicamente el sufijo contextual de isla. Las direcciones originales mínimas y las normalizaciones están descritas en el manifiesto. País e isla corresponden al ámbito geográfico revisado, no a una conclusión basada únicamente en el prefijo postal.

La ficha de **SuperDino Los Gigantes, ID 162**, publica CP **38436** junto con Santiago del Teide. Esa asociación requiere aclaración. El CP se conserva exactamente, sin corregirlo a otro. El punto que incluye el HTML permanece únicamente como observación documental en el manifiesto; el registro de la app queda pendiente y **no contiene coordenadas**. No puede utilizarse ese punto como ubicación validada para futuras búsquedas de proximidad.

`published` significa que las coordenadas constan en la ficha oficial revisada; no garantiza su precisión, ni certifica rutas, tiempos, tráfico o acceso. En este bloque no se calcula cercanía ni se geocodifica a la persona usuaria. Los puntos sin fuente coherente deben seguir excluidos de un futuro cálculo de distancia hasta resolver su estado.

## Alcance comercial y de derechos

Todos los registros se refieren al canal **físico**, con cobertura de precios **`NO_VERIFICADA`**. Un punto de venta no acredita que suministre pedidos online, tenga reparto a un CP o publique precios vigentes. No se heredan precios, disponibilidad o acuerdos entre HiperDino, SuperDino y Express. El canal online y los centros suministradores conservan su ámbito separado.

`FACTUAL_REFERENCE_ONLY` describe el alcance de estas referencias mínimas; **no declara una licencia abierta, autorización de extracción de directorios, API de cadena o permiso comercial general**. Se conservan las URLs oficiales y su procedencia. Cualquier ampliación, mapa o distribución comercial debe revisar los derechos aplicables a la fuente y a los servicios utilizados. No se usaron OpenStreetMap, Open Prices ni sus snapshots históricos para completar este lote.

No se publican los HTML completos, scripts, claves de mapas/buscadores, cookies, tokens, teléfonos, productos ni precios de las páginas. No se consultan APIs privadas o de precios desde el cliente, no se conecta un feed y no se envían solicitudes comerciales. Los originales privados quedan fuera de Git y de la lista de archivos de la preview.
