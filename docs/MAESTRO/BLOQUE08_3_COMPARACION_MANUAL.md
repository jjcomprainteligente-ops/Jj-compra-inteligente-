# B08.3 · Comparación de dos cestas manuales

**En construcción · 27/11/2026.** Continúa B08.2 sobre la aplicación existente.
Este checkpoint no acredita todavía pruebas finales, publicación ni aceptación visual.

## Entrega acotada

En Ahorro → Mis precios → Revisar cesta manual se prepara una primera opción y se retiene
temporalmente. Después se revisa una segunda. Ambas corresponden a la misma lista exacta,
con las mismas necesidades pendientes y el mismo día de Tenerife. Cada opción conserva
establecimiento declarado, formato, CP, canal, origen y fecha de los precios, gastos y mínimo.

El Bloque 08 maestro permite comparación manual sin feeds. Esta entrega compara únicamente
dos revisiones manuales del mismo canal; no activa fuentes comerciales, stock, checkout,
cuentas, compra repartida ni un ranking general de supermercados. CP diferentes son posibles:
cada establecimiento mantiene su ámbito declarado. No se certifican cercanía, servicio o transporte.

## Presentación y confirmaciones

Antes de implementar se presentaron dos ubicaciones de datos: tarjetas verticales y tabla
de dos columnas. Se eligieron tarjetas verticales para conservar la lectura en iPhone pequeño,
usando los componentes, tipografía Manrope y colores Verde Mercado Premium existentes.
No cambia el logotipo ni la navegación principal. La revisión estética humana sigue pendiente.

Se muestran juntas las dos observaciones de cada producto: marca, variante, calidad,
presentación, contenido, unidad, establecimiento, precio, fecha y fuente. Una confirmación
nueva por línea declara equivalencia entre tiendas para la misma necesidad; no se hereda
de las confirmaciones individuales. Los envases pueden tener tamaños distintos: el motor
calcula los envases enteros necesarios, coste proporcional y sobrante en cada opción.

Se exige además confirmar establecimientos distintos y observaciones independientes.
La UI bloquea el mismo destino declarado y la reutilización de un registro de observación
en ambas opciones. Ni los nombres, ni `product-N`, ni el identificador interno `manual-store`
acreditan una identidad comercial; no existen GTIN/SKU verificados en estos datos manuales.

## Importes y límites

Ambas solicitudes se validan y recalculan; nunca se confía en totales recibidos. Necesidades,
identificadores, cantidades y unidades deben coincidir exactamente. El cálculo no suma
costes proporcionales consumidos para decidir el desembolso.

Solo se muestra diferencia total si ambas cestas están completas, tienen gastos conocidos,
mínimo conocido y cumplido, y todas las confirmaciones están hechas. La parcialidad,
un precio ausente/antiguo o los costes desconocidos explican la falta de comparación:
no convierten un subtotal bajo en una opción ganadora. El empate tiene diferencia cero;
`null` continúa siendo desconocido, incluso cuando el subtotal conocido es cero.

La formulación se limita al menor importe **entre estas dos revisiones manuales** y a una
diferencia aritmética. No promete ahorro real, disponibilidad ni el supermercado más barato.
Se conservan los avisos de precios no verificados y pendientes de IGIC, condiciones y derechos.

## Conservación, vigencia y seguridad

Todo vive en memoria; no se añade ningún documento persistido, petición de comercio,
permiso, servicio o dependencia. Editar el segundo borrador conserva la primera opción,
pero elimina el segundo resultado y sus confirmaciones cruzadas.

Cambios en los documentos fuente completos de listas/observaciones, día, foco, almacenamiento,
reactivación, fallo de lectura, salida o privacidad invalidan las revisiones. Antes de comparar
se releen ambos documentos, sin reclamar el cerrojo de escritura. Se aplican guardias de
montaje, generación y firma para descartar respuestas tardías. La fecha se comprueba también
al renderizar. Esta frescura local no equivale a una transacción distribuida ni a sincronización.

La firma canónica de ambos documentos se calcula únicamente en Mis precios y se memoriza
por identidad de los datos; no se registra, exporta ni transmite. Los cuatro idiomas de interfaz
centralizan etiquetas, errores y accesibilidad; moneda EUR y formatos locales existentes.

## Criterios de cierre

Validación de frontera y oráculos independientes; cobertura 0/50/100 %, costes desconocidos/cero,
empates, gastos que cambian el orden, reutilización y equivalencia no revisada. Matriz de navegador
en ES/EN/DE/FR con Chromium y WebKit 375/430, regresión de B08.2 y pruebas de conservación
de los siete documentos, offline, invalidación y cancelación. Tipos, exportaciones, dependencias,
secretos y procedencia GitHub/staging deben quedar documentados con resultados reales.

B08.1/B08.2 ya cerró su auditoría conjunta. B08.3 tendrá su comprobación de entrega; la siguiente
auditoría por pareja corresponde tras B08.4. No se inicia B08.4 automáticamente.
