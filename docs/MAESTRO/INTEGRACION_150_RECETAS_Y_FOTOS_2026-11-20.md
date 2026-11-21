# Integración de 150 recetas y fotografías | JJ Compra Inteligente

**Estado · 20/11/2026: EN_CURSO.** El propietario pidió iniciar la integración y conservar todo el trabajo anterior. La recepción de esta entrega está completa; el catálogo y las fotografías todavía necesitan su verificación de aplicación y una publicación propia. No se atribuyen a esta candidata resultados de entregas anteriores.

Base: `main`, commit `69582c2010222769db8cf646b745aea544684e42`. Rama de trabajo: `codex/integrar-recetas-fotos150-2026-11-20`. La autorización de las 150 recetas y de las fotografías sigue vigente. La autorización permanente de previews permite publicar la prueba cuando la entrega esté comprobada. La aceptación y fusión de un nuevo PR concreto en main conservan la puerta explícita de la [política de integración](POLITICA_INTEGRACION_Y_RECUPERACION.md); la autorización ejecutada del PR #29 no se presenta como fusión de esta nueva entrega.

## Fuente recibida y verificada

La subida del 19/11/2026 a las 23:38:28 UTC añade las 150 fotografías individuales y el ZIP de datos en `referencias/recetas/V3/APP_LIGERO_10MB/`. Es posterior a la recepción parcial descrita en los informes del 18 y 19/11. Las menciones históricas a 12 fotos y 138 faltantes conservan su fecha; no describen esta entrega completa.

| Material | Resultado de recepción del 20/11 |
|---|---|
| Catálogo | 150 IDs únicos y 750 fichas en es/en/de/fr/bg. |
| ZIP `JJ_V3_APP_DATOS_150_RECETAS_5_IDIOMAS.zip` | 1.994.471 bytes; SHA-256 `e5654006ec2c6716b1cac8cdabbdca2f08422d31ba0982e9b3a888c02e874270`. |
| Fotografías seleccionadas | 150 JPEG individuales, 96.304.512 bytes en total; cero faltantes. |
| Dimensiones de fuente | 148 imágenes de 1536 × 1024 y dos de 1600 × 1200. |
| Integridad y decodificación | IDs, rutas, tamaños, SHA-256 y SHA de blob Git coinciden con el manifiesto. Contenedores y decodificación completa comprobados con Pillow 13.0.0 fijado. |
| Archivos anteriores | Los doce PNG previos se conservan aparte. No son doce recetas adicionales. |

La validación usó el motor central existente, perfil `app10mb` y fotos sueltas. Resultado: `COMPLETE_VERIFIED`, salida 0, 150 recetas, 750 fichas y 150 fotos recibidas. No fue necesario crear staging ni modificar la app durante esa comprobación.

[Instrucciones de la fuente](../../referencias/recetas/V3/APP_LIGERO_10MB/README_CATALOG_V3.md) · [manifiesto de fotografías individuales](../../referencias/recetas/V3/APP_LIGERO_10MB/MANIFIESTO_FOTOS_INDIVIDUALES_150.json) · [recepción segura](../../referencias/recetas/V3/README_CODEX.md).

## Entrega A: catálogo y conservación

La base publicada tiene 120 recetas V83 y siete anteriores, 127 accesibles. La candidata debe incorporar las 150 de la fuente sin volver a añadir las 120 ya existentes: **150 del catálogo verificado más siete anteriores, 157 IDs únicos previstos**. La cifra no significa 157 recetas nuevas. Los siete IDs anteriores permanecen disponibles para los menús y listas que ya los referencian.

La proyección V3 reutiliza las reglas auditadas de cantidades, unidades y notas. Debe demostrar igualdad exacta de las 120 proyecciones y mensajes anteriores, conservar los siete registros previos y añadir las treinta identidades que faltaban. Los módulos y fuentes V83 históricos se conservan; no se sustituyen sus resultados originales por cifras de esta nueva candidata.

Las cantidades siguen representadas como enteros en milésimas. Los ingredientes sin medida permanecen visibles y fuera de la transferencia automática. No se inventan tiempos desconocidos, cantidades, equivalencias o categorías para completar campos. La receta canónica gobierna el cálculo; la traducción es una vista y no cambia un producto o nota introducidos por el usuario.

Los textos de recetas se mantienen centralizados. Se preservan las claves existentes y se evita duplicar las traducciones de las 120 anteriores. La interfaz sigue en es/en/de/fr, con respaldo español, preferencia manual persistente y EUR; BG continúa en la fuente sin activar una quinta interfaz incompleta.

## Entrega B: fotografías en la interfaz existente

Se preparan derivados locales para el cliente a partir de las 150 fotografías recibidas: miniaturas de hasta 192 px y detalles de hasta 960 px, JPEG con calidad 80. Se prevén **300 archivos derivados**, con manifiesto de procedencia, dimensiones, tamaños y hashes. Las fotografías recibidas y los doce PNG anteriores permanecen intactos; los derivados no se presentan como originales idénticos bit a bit.

El mapa de recursos de Metro utiliza rutas estáticas y búsqueda exacta por ID. No importa al cliente el ZIP, el manifiesto completo de recepción ni rutas privadas; no consulta un servidor externo para decidir la imagen. Un ID desconocido no se transforma en una ruta o URL.

Las miniaturas ocupan los espacios de icono existentes en las filas. Su montaje progresivo y la paginación evitan cargar las 150 al abrir el catálogo. El detalle se carga al abrir la ficha y conserva la proporción de la imagen, sin recortar ingredientes. Deben conservarse Verde Mercado Premium / GPT-6 V2, logo oficial, Manrope, cabeceras, navegación y las acciones de revisión.

Los textos alternativos y los estados de carga o error se localizan en los cuatro idiomas de interfaz. Un fallo de imagen muestra un recurso o mensaje local claro y no cambia recetas, cantidades, filtros ni documentos guardados. Las siete recetas anteriores no reciben una fotografía inventada. Los observadores web deben limpiarse al desmontar y disponer de una alternativa acotada cuando no estén disponibles.

## Fronteras de seguridad y datos

- Los siete documentos locales, sus claves, validadores, protección de escritura y coordinación entre operaciones se conservan. No hay migración ni conversión implícita del menú guardado; la interfaz sigue en cinco comidas para 1–12 personas.
- El compilador de imágenes debe validar la fuente, procesar un archivo acotado cada vez y comprobar salidas reproducibles. Su modo `--check` es de solo lectura. Pillow permanece fijado como herramienta de construcción y auditoría, fuera de las dependencias de Expo.
- Los archivos recibidos no se ejecutan. No se aceptan rutas arbitrarias, enlaces simbólicos, archivos no regulares, identidades repetidas o cambios de hash como si fueran la entrega verificada.
- No se añaden autenticación, bases de datos, hogares, sincronización, IA, feeds, servicios de pago ni credenciales. Supabase y sus políticas permanecen fuera de este cambio.
- Los alérgenos declarados por ingredientes y la fotografía no certifican ausencia de alérgenos o trazas. Precios, SKU, marcas y etiquetas comerciales continúan pendientes de fuentes oficiales.

La revisión de hashes y decodificación no acredita por sí sola derechos, correspondencia visual con el plato, revisión lingüística externa o un respaldo externo independiente. Esos alcances deben quedar separados de los controles técnicos.

## Matriz de comprobación y criterio de cierre

Todos los controles siguientes están **pendientes de resultado final de esta candidata**, salvo la recepción completa ya registrada arriba. Las cifras y los SHA se rellenarán con ejecuciones reales; no se reutilizan como nuevos los resultados de B05.2 o de la consolidación del 19/11.

| Área | Comprobación requerida |
|---|---|
| Catálogo | 157 IDs únicos, siete anteriores idénticas, 120 proyecciones conservadas y treinta añadidas; reproducción desde la fuente fijada. |
| Traducciones | Contenido centralizado, claves anteriores compatibles, cuatro idiomas de UI completos, respaldo español y BG conservado en fuente. |
| Recursos | 150 asociaciones exactas y 300 derivados reproducibles; originales conservados y ningún recurso desconocido o externo en el cliente. |
| Visualización | Las 150 fotografías de detalle y sus miniaturas cargan con el ID correcto; carga progresiva, paginación y error/reapertura comprobados. |
| Recorrido diario | Receta anterior y receta nueva → raciones → revisión → lista; cantidades exactas, confirmación, cancelación y persistencia de IDs. |
| Conservación | Siete documentos, contratos de menú, conflictos de escritura, privacidad, fuentes, logo y tipografía sin pérdidas. |
| Responsive y accesibilidad | Cuatro idiomas en web y WebKit de tamaños iPhone; etiquetas legibles, foco, texto alternativo y sin recorte o desbordamiento. |
| Código y seguridad | Tipos, unitarias, Python, dependencias y revisión independiente; los avisos conocidos se reportan sin prometer seguridad absoluta. |
| Artefactos y publicación | Exportaciones web/iOS/Android, commit y árbol exactos en GitHub, CI real y staging protegida verificada por HTTPS y hashes. |

Al terminar las dos entregas se realiza la auditoría conjunta antes de declarar el cierre. La vista de prueba debe identificar el commit comprobado, preservar la protección y dejar fuera credenciales, datos locales y trazas con acceso temporal. La aceptación estética, la prueba física detallada de iPhone y un binario nativo firmado conservan sus registros propios.

## Estado de publicación y siguiente acción

**EN_CURSO: sin nuevo commit de fuente, PR, resultados finales ni preview de esta integración registrados todavía.** La preview anterior conserva su fuente y su caducidad; no acredita las 150 fotos en la aplicación. La producción no se promueve.

Siguiente acción: completar y comprobar catálogo y fotografías, registrar la auditoría conjunta, publicar el código revisable en GitHub y verificar la prueba protegida autorizada. Presentar el nuevo PR concreto para aceptación de integración en main. No se abre automáticamente otro bloque ni se vuelve a solicitar el permiso ya concedido para las 150 recetas, sus fotos o una preview comprobada.
