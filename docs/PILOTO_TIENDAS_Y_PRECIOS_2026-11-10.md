# Piloto de tiendas y precios · 10 de noviembre de 2026

## Decisión del propietario

Preparar JJ para demostrar recetas, listas, evaluación de gastos y comparación con una tienda, varias o todas. La compra y el pago se completan siempre en la web/app de la tienda elegida o en su establecimiento. JJ no cobra ni procesa pedidos. Se presentará la app a las cadenas antes de solicitar sus accesos oficiales; esta entrega no envía solicitudes a terceros.

Se interpreta «mercado» como Mercadona por el contexto de la enumeración. La fuente es la versión más reciente existente, `936459d`, rama `codex/menus-privacidad-local`; se conservan el diseño V2, los menús y la privacidad. No se vuelve a la versión antigua de `main`.

## Resultado de la consulta pública

Consultar una web pública permite comprobar qué publica una cadena. No equivale a tener un feed comercial autorizado, acceso al stock o permiso de transferencia de carritos. No se ha acreditado una API pública oficial de precios para estas cadenas. No se han usado APIs privadas, credenciales de cliente, extracción masiva ni servicios de terceros.

| Tienda/formato | Información encontrada | Uso inmediato en el piloto |
|---|---|---|
| Lidl | Folletos semanales y páginas de ofertas; existen folletos específicos de Canarias en las fichas de tienda. La venta online de bazar no acredita un supermercado alimentario online. | Abrir ofertas oficiales; seleccionar Canarias y vigencia; preparar lista presencial. Catálogo completo de alimentación y checkout alimentario no confirmados. |
| ALDI | Precios y ofertas publicados. Su web indica que ALDI España no tiene tienda online. Ofertas y productos pueden variar en Canarias y por establecimiento. | Abrir folleto oficial; seleccionar región/tienda; lista para comprar presencialmente. |
| HiperDino | Supermercado online, productos y precios públicos, entrega/recogida. Su web advierte que cambiar CP puede cambiar el centro suministrador, el surtido y el precio de la cesta. | Abrir compra online oficial y resolver allí CP/cobertura. Ningún precio se atribuye automáticamente a todas las sucursales. |
| SuperDino | Formato de proximidad distinto, con localizador de establecimientos. | Selección propia y enlace a establecimientos; confirmar el precio en la sucursal. No hereda los precios del canal online. |
| HiperDino Express | Formato turístico con surtido adaptado y localizador propio. | Selección propia y enlace a establecimientos. Stock, precios y compra online de cada Express sin confirmar. |
| Mercadona | Entrada oficial por código postal, que dirige al nuevo servicio o a la web clásica según zona. | Abrir tienda oficial y comprobar servicio/precios para el CP real. No extrapolar un catálogo peninsular a Tenerife. |

Las seis páginas de destino incluidas en el cliente respondieron HTTP 200 el 10/11/2026. Esto verifica el acceso a esas páginas; no prueba cobertura de reparto para un domicilio, un precio en caja ni una sesión de compra completa. No se realizó ningún pedido.

## Fuentes oficiales consultadas

- [Lidl, folletos](https://www.lidl.es/c/descubre-nuevas-ofertas-cada-semana-folletos-lidl/s10087402).
- [Lidl, ficha con folleto Canarias](https://www.lidl.es/s/es-ES/tiendas/las-palmas-de-gran-canaria-gran-canaria/av-juan-carlos-i-5/). Esta ficha acredita el folleto regional; no se utiliza como establecimiento de Tenerife.
- [Lidl, lanzamiento del canal de bazar en Canarias](https://empresa.lidl.es/sala-de-prensa/actualidad-lidl/lidl-inicia-en-canarias-la-venta-online-de-articulos-de-bazar), noticia del 28/10/2024, interpretada con su fecha.
- [ALDI, preguntas frecuentes de la portada](https://www.aldi.es/) y [folleto/regionalización](https://www.aldi.es/folleto.html).
- [HiperDino, supermercado online](https://www.hiperdino.es/) y [formatos de establecimientos](https://www.hiperdino.es/c9504/nuevas-ubicaciones).
- [HiperDino/SuperDino, establecimientos](https://www.hiperdino.es/tiendas/).
- [HiperDino Express, establecimientos](https://hiperdinoexpress.com/tiendas).
- [Mercadona, entrada oficial por CP](https://www.mercadona.es/) y [explicación de cobertura](https://ayuda.tienda.mercadona.es/hc/es/articles/360001935371--El-nuevo-servicio-de-compra-online-llega-a-mi-c%C3%B3digo-postal).

La consulta de [arroz en un contexto de HiperDino](https://www.hiperdino.es/c9512/alimentacion/arroz.html?p=2) devolvió el arroz largo HiperDino de 1 kg a 1,08 €, mientras [otro contexto de la misma web](https://www.hiperdino.es/c9500/alimentacion/arroz.html?p=2) mostraba 0,95 € como oferta y 1,08 € como precio anterior. No se ha identificado el centro/CP ni confirmado vigencia en una sesión localizada. Son evidencia de por qué hace falta ese contexto, no una comparación ni precios verificados que se incorporen a JJ.

## Función preparada en esta entrega

- Mis tiendas incluye Lidl, ALDI, HiperDino, SuperDino, HiperDino Express y Mercadona como seis opciones separadas.
- Admite una, varias o todas las del piloto; permite quitar la selección. Se guarda con la protección de escritura existente y sigue disponible tras recarga.
- Conserva la lectura de los antiguos identificadores Carrefour/Otra tienda y los recordatorios locales. Elegir todas añade las seis del piloto sin perder favoritas anteriores.
- Cada selección muestra un enlace público adecuado: compra online, ofertas o localizador. No se envía lista, presupuesto, dieta o carrito a la cadena.
- Interfaz nueva traducida a los cuatro idiomas actuales. Conserva listas, presupuesto, gastos confirmados, menús y comparadores manuales.
- No hay descarga ni actualización automática de precios. Las favoritas seleccionadas no filtran todavía el comparador manual; este conserva sus observaciones independientes. No se promete stock, carrito transferido o ahorro calculado por seleccionar una tienda.

## Contrato para la siguiente conexión de datos

Cada observación comercial deberá contener cadena, formato de tienda, sucursal/centro suministrador, código postal/zona, canal online o físico, referencia/EAN cuando exista, marca, variante/calidad, tamaño de envase, cantidad/unidad, precio en céntimos, fecha/hora, URL/fuente, vigencia y condiciones de oferta o fidelización. La procedencia y su autorización se verifican antes de habilitar una importación periódica.

Un precio pendiente de localización, caducado, no comparable o de demostración no sirve para un ranking de ahorro. Una cesta incompleta muestra cobertura e importe parcial; no gana una clasificación frente a otra completa. Sin dato se muestra «Sin precio verificado», no cero euros.

La comparación tendrá dos resultados distintos: cesta completa en una tienda y reparto de artículos entre las tiendas seleccionadas. En el segundo, cada tienda conserva su propia compra externa; no habrá un pago conjunto en JJ. Se comparan envases equivalentes y precios por kg/L/unidad, redondeando a envases enteros para el desembolso. Gastos, mínimos y condiciones de entrega pendientes de confirmar permanecen pendientes.

Las recetas distinguen coste de ingredientes consumidos, previsión de envases que se necesitan comprar y gasto realmente pagado. Los importes se incorporan solo desde observaciones válidas o datos introducidos por la persona, conservando su etiqueta y fuente. El presupuesto no se convierte en gasto por añadir ingredientes o abrir una tienda.

Tras validar el piloto se solicitará a cada cadena un feed/API o permiso de catálogo y precios por zona/sucursal, frecuencia y condiciones de actualización, imágenes/referencias permitidas y capacidades de enlace/lista/carrito. El checkout y el pago seguirán en la tienda. Hasta que se confirme el acceso, las funciones locales permiten presentar la app y probar su utilidad sin fingir una integración.

## Validación de esta entrega

TypeScript y 759 pruebas unitarias correctos. Exportaciones web, iOS y Android completadas. La suite de navegador se intentó sobre la exportación: el Chromium local falla antes de ejecutar los casos porque el entorno deniega el socket de ProcessSingleton (`Operation not permitted`). No se atribuye ese intento a pruebas de aplicación correctas. La verificación directa de la preview queda pendiente de registrar. La prueba web no equivale a Safari/iPhone físico ni a una compra real.


## Integracion y verificacion posterior

El 11/11/2026 se integra esta entrega con accesibilidad y listas compartibles. El bloqueo inicial de navegador queda superado por la nueva pasada conjunta: 298 Chromium y 92 WebKit correctos, incluidos los 50 recorridos nuevos. Véase [auditoría vigente](TIENDAS_COMPARTIR_Y_AUDITORIA.md). La prueba no activa un feed de precios ni acredita compras físicas.
