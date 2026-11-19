# Fuente de recetas V83 y proyección de la aplicación

El repositorio de JJ Compra Inteligente es público. El ZIP original recibido contiene 150 recetas y sus cinco versiones (es/en/de/fr/bg), incluidos 30 registros retenidos por estados pendientes o contradictorios. Ese original se conserva byte a byte en `originales/`, una carpeta ignorada por Git. No se sube a GitHub ni se publica como recurso de la preview. El XLSX separado coincide con el embebido; permanece dentro de ese original local, sin duplicación pública.

## Fuente pública reproducible

`fuente-publica/JJ_V83_120_RECETAS_FUENTE_PUBLICA.zip` contiene únicamente dos archivos de datos: `120_RECETAS_FUENTE_ORIGINAL.json` y `PROVENIENCIA.json`. Las 120 fichas seleccionadas conservan íntegros los valores de sus registros originales y los cinco idiomas, comprobados contra la fuente con decimales exactos. La selección no modifica instrucciones, ingredientes, advertencias o estados históricos dentro de esos registros. No contiene los pasos, títulos ni ingredientes de las 30 fichas retenidas. De esas fichas la procedencia solo conserva ID, posición, motivo y hash del registro.

El SHA-256 del ZIP público está fijado en el importador. El ZIP usa dos nombres permitidos, fecha fija y compresión determinista. Su comprobación valida tamaños, expansión, rutas, tipos de archivo, cifrado, UTF-8, claves JSON repetidas o inseguras, números finitos, 120 IDs/posiciones elegibles, sus cinco idiomas y los anclajes/cantidades/pasos. Los hashes de registro usan JSON UTF-8 con claves ordenadas recursivamente, separadores compactos y números finitos normalizados, sin salto de línea final. No se ejecuta código suministrado, se evalúan fórmulas, se extraen rutas arbitrarias ni se usa la red.

La procedencia registra el resultado de la ingesta privada de 150 fichas: 14 entradas, 13 hashes del manifiesto suministrado y el XLSX idéntico. La reproducción pública no vuelve a afirmar esa verificación completa: comprueba la selección pública y sus hashes. No contiene los ZIP históricos grandes mencionados en documentos heredados; no se han recibido ni reconstruido.

## Reserva editorial

Las posiciones 11–20 y 111–120 presentan contradicciones entre estados actuales; 31–40 mantiene cata pendiente. Sus 30 contenidos completos quedan fuera de GitHub, del catálogo de cliente y de sus traducciones compiladas hasta que el propietario aclare esos estados. El original local y sus estados no se borran. Las 120 fichas seleccionadas son contenido editorial con advertencias; esta selección no autoriza publicación comercial, no certifica seguridad sanitaria y no presume nuevas catas. El búlgaro de las 120 seleccionadas está conservado en la fuente pública; no se activa una interfaz parcialmente traducida. Las 30 traducciones búlgaras retenidas siguen en el original local.

## Proyección sin inventar cantidades ni certificaciones

Se mantienen IDs, raciones, pasos y todas las advertencias. Los tiempos desconocidos siguen siendo null. Las fases de espera declaradas se muestran separadamente y no se suman para inventar una duración total. Los gramos y mililitros se representan exactamente en milésimas; las unidades fuente especiales conservan visible diente/hoja/rama/vaina/tallo/tira/rebanada o tamaño de250g dentro del nombre contable. No se convierten dientes a cabezas de ajo ni se inventa su peso. El manifiesto detalla los alias y conserva por receta las líneas y unidades originales.

Las tres sales al gusto se muestran sin cantidad numérica y nunca pasan a la lista automática. Los dos ingredientes medidos opcionales conservan esa condición en una nota traducida. Los acompañamientos opcionales sin medida siguen en los pasos/notas originales, sin generar productos. Las categorías de compra quedan en Otros, pendientes de clasificación explícita; no se deducen preferencias vegetarianas/veganas ni alérgenos por apariencia o título. No hay precios ni productos comerciales certificados.

Se prioriza la prosa editorial posterior expresamente suministrada (v58 frente a v57), sin reescribir los pasos. La nota posterior del romero se conserva como adenda editorial, mientras el historial original sigue intacto en el registro fuente. Las rationale v78 se repiten en español incluso dentro de las otras traducciones de fuente: se muestran como respaldo español expresamente rotulado, sin inventar instrucciones traducidas. Los controles administrativos o históricos de QA no se presentan como garantía sanitaria. Las condiciones de productos, etiquetas, trazas y cata de cada ficha siguen siendo advertencias.

## Reproducir desde un clon público

```sh
python3 scripts/import-recipes-v83.py --check
python3 scripts/import-recipes-v83.py
```

Ambos comandos usan por defecto la fuente pública de 120 fichas. No necesitan el original privado de 150. `--check` compara los cuatro artefactos generados byte a byte sin escribir. Se puede indicar otro destino local de la selección con `--public-source RUTA`; solo se aceptan sus bytes fijados.

Para repetir la auditoría completa cuando se dispone del adjunto original, se admite `--source-zip RUTA` y, opcionalmente, `--source-xlsx RUTA`. Ese modo verifica el ZIP completo y sus 13 hashes, comprueba que produce exactamente la selección pública fijada y después reproduce los mismos artefactos. Un original archivado diferente nunca se sobrescribe. El modo `--check` tampoco archiva ni escribe archivos. La carpeta `originales/` debe permanecer excluida de todos los commits y paquetes de despliegue.
