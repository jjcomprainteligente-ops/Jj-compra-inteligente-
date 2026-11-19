# Auditoría visual V2 — preparación pendiente

Fecha: 2026-11-06. Revisión de solo lectura; no se ha modificado la aplicación ni documentación del repositorio.

## Conclusión verificable

La entrega actual **no completa las 16 pantallas canónicas ni los nueve estados** del paquete V2. Existe una buena base visual y funcional local, pero el color y la tipografía común no equivalen a haber trasladado todo el diseño. Hay seis vistas centrales presentes (bienvenida, inicio, compra, ahorro, menús y perfil), dos flujos presentes como paneles (receta e ingredientes), un presupuesto implementado mediante tarjetas y formulario modal, y siete vistas sin interfaz propia (búsqueda, detalle de producto, voz, escáner, tiendas, historial y notificaciones). En total ocho vistas canónicas no disponen de su subpantalla correspondiente, incluyendo Presupuesto.

`src/app/types.ts:3` permite solamente `home`, `list`, `savings`, `menus`, `profile`, `comparisons`, `prices`, `language`. Los paneles no amplían esa unión: `ShoppingApp` aloja formularios de lista/presupuesto/producto/información/confirmación y `MenuWorkspace` receta/revisión/sustitución/importación. La revisión no encontró una galería V2 que completase la cobertura de las vistas ausentes.

## Fuentes realmente inspeccionadas

- La composición original `referencias/gpt6-v2/extraidos/v2/JJ_16_PANTALLAS_CANONICAS_V2.png` y la composición original de nueve estados `JJ_B03_14_9_ESTADOS_V2.png`, ambas abiertas visualmente.
- Contrato V2, flujos de las 16 pantallas y estados B03.14.
- Capturas locales `design/v2/evidence/run-2026-11-06T15-03-13-733Z-1VEvNi/screenshots/`: bienvenida, inicio 375/430, lista, ahorro, menús, receta, revisión, perfil en español; inicio alemán 375.
- Captura remota `design/v2/hosted/run-2026-11-06T19-05-33-744Z-9ylBZ8/es-home.png` y su informe de comprobación. Corresponde a una instalación vacía, por lo que “Sin definir” es correcto y los 125 € de las capturas locales son datos de prueba propios; no es un desvío que deban reemplazarse por los 60 € ficticios del diseño.
- Brief B01-L del logo, tablero conceptual 2D/3D, brief Premium y moodboard Premium, abiertos/leídos. La composición canónica V2 prevalece; el moodboard no autoriza precios, variantes de marca ni atribuciones alimentarias.
- Componentes `ShoppingApp`, `HomeList`, `SecondaryScreens`, `MenuWorkspace`, `LanguageScreen`, `ui` y tokens `theme`.

## Cobertura de las 16 vistas

| V2 | Estado actual y evidencia | Preparación necesaria |
|---|---|---|
| 01 Bienvenida | Presente; logo fuente en tarjeta crema sobre verde; sin pestañas. Idioma visible y un único “Empezar sin cuenta” son adaptaciones justificadas por el requisito multilingüe y modo local. | Mantener logo exacto. Revisar proporciones en ancho comparable. No añadir 3D sin revisión de su bloque independiente. |
| 02 Inicio | Presente, misma dirección visual. Buscador aparente abre formulario manual, con `+`, no búsqueda/dictado. No acceso a voz/escáner ni campana. | Conectar campo a búsqueda real local y entrada manual; incorporar accesos honestos a voz/escáner; campana. Corregir jerarquía en tamaño compacto. |
| 03 Mi compra | Presente y útil: categorías, cantidades, selección, CRUD, presupuesto. Composición más densa que V2: título en dos líneas, selector, renombrar/eliminar, presupuesto y previsión antes de la primera fila. | Mantener funciones anteriores mediante acciones secundarias compactas. Acercar título y agrupación a V2; preservar controles accesibles y confirmación de borrado. |
| 04 Ahorro | Presente; tarjeta de presupuesto, mensaje sin fuentes, lista y “Sin cálculo de ahorro” alineados conceptualmente. Añade importes y comparadores manuales. | Añadir navegación real a Presupuesto/Historial/Mis tiendas, mantener herramientas manuales como secundarias. Separar siempre importes anotados y pagos confirmados. |
| 05 Menús | Presente, plan local de cinco cenas, selector Esta semana/Descubrir, personas y sustituciones. Captura 430×932: cuatro días llenan la pantalla y Revisar ingredientes/Descubrir quedan abajo. | La canónica muestra dos filas compactas y CTA visible. Presentar resumen de dos platos con Ver semana completa o CTA fijo y control de personas compacto. Conservar los cinco días y el plan completo. |
| 06 Detalle receta | Parcial: sheet con ingredientes, pasos, alérgenos y CTA al final. No subpantalla, pestañas y cabecera canónica no están visibles; no control de raciones en el detalle. | Pantalla completa con Atrás, raciones, ingredientes compactos y CTA visible. Conservar pasos y advertencias mediante secciones desplegables/scroll; no borrar contenido. |
| 07 Revisar ingredientes | Parcial: sheet funcional; elige lista, edita cantidades, detecta duplicados, confirma/cancela. Introducción larga ocupa gran parte del primer viewport. | Pantalla completa; resumen Ya lo tengo / Ya en Mi compra / Ingredientes que faltan. Mantener edición progresiva y decisiones explícitas, CTA fijo y salida con confirmación si hay borrador. |
| 08 Buscar producto | Ausente. Entrada inicial abre formulario de alta; comparador manual no es catálogo de compra. | Búsqueda de productos ya guardados y/o catálogo local explícitamente ilustrativo, con resultados filtrados, sin ranking o precio inventado; alternativa Introducir manualmente. |
| 09 Detalle producto | Ausente. Formulario de artículo con precio opcional no equivale a ficha. | Ficha de datos locales con cantidad/unidad y fuente disponible. Sin origen afirmado ni precio verificado inventado. CTA revisar antes de añadir. |
| 10 Voz | Ausente; texto de menús declara que no hay micrófono conectado. | Preparar pantalla y ruta manual. Estado real Disponible/No disponible/Permiso, sin mostrar Escuchando si no se captura audio. La revisión textual local puede funcionar antes de habilitar voz. |
| 11 Escáner | Ausente; no integración de cámara ni código. | Preparar pantalla y entrada manual; disponibilidad/permiso honestos. Barcode ilustrativo sólo en revisión identificada. Lectura real y catálogo requieren trabajo específico, no un dibujo que parezca cámara activa. |
| 12 Mis tiendas | Ausente; Perfil no tiene esa fila. Los nombres de tiendas usados por comparadores no son preferencias de tiendas. | Subpantalla con HiperDino/Carrefour/Mercadona/Otra, “Sin catálogo conectado”, favoritos opcionales locales y ninguna conexión comercial simulada. |
| 13 Presupuesto | Parcial: tarjetas funcionales y sheet con importe editable. No subpantalla Control de dinero ni CTA Registrar gasto real. | Subpantalla reutilizando datos existentes. Gasto real permanece sin registrar hasta existir un registro manual de gasto confirmado y separado; no convertir checks ni estimaciones en pagos. |
| 14 Historial | Ausente. No entidad de gasto confirmado; la ficha `spentCents` cuenta marcados y se explica que no son pagos. | Preparar pantalla vacía y navegación. Si se implementa Añadir gasto, registro manual local con validación, fecha, EUR y confirmación; requiere persistencia aditiva/migración probada. No inventar movimientos. |
| 15 Perfil y hogar | Presente; modo local, hogar Próximamente, presupuesto, idioma, privacidad y preferencias. Falta Mis tiendas. Mi hogar/Privacidad muestran información, no subpáginas completas. | Añadir Mis tiendas y rutas locales de preferencias cuando corresponda. Mantener colaboración Próximamente y el acceso por avatar. Evitar duplicación vertical del título con fila Atrás demasiado alta. |
| 16 Notificaciones | Ausente; no campana, pantalla, filtros ni preferencias. | Campana → pantalla completa con filtros Todos/Listas/Recetas y vacío honesto. Preferencias opcionales locales; no activar recordatorios del sistema sin permiso ni afirmar que ofertas están conectadas. |

## Cobertura B03.14 de los nueve estados

| Estado original | Situación de aplicación | Cierre requerido |
|---|---|---|
| 01 Lista vacía | Parcial: tarjetas “sin lista” y “sin productos”; botón global para añadir si existe lista. | Componente de estado grande alineado con referencia, salida Añadir y acceso a receta. Distinguir lista no creada de lista vacía. |
| 02 Sin precios | Parcial: aviso honesto en Ahorro y cantidades incompletas en lista. | Estado reutilizable con acción real Volver a Mi compra. Mantener importes manuales sólo donde están identificados. |
| 03 Sin conexión | Sin vista o detector encontrado. Local storage puede funcionar durante sesión sin red; no demuestra instalación/carga offline. | Aviso real si plataforma informa desconexión; continuidad local, sin sincronización ficticia. Ejemplo visual en revisión explícita para probar diseño. |
| 04 Error temporal de red | No flujo remoto de compra activo; errores de persistencia tienen aviso, no equivalen a error de red. | Preparar estado reusable y revisión; activarlo sólo ante un fallo real de una operación real. Reintentos no deben duplicar acciones. |
| 05 Micrófono denegado | Ausente. | Pantalla estado con escritura manual; Ajustes sólo si plataforma lo permite y permiso realmente denegado. |
| 06 Cámara denegada | Ausente. | Pantalla estado con código manual; no afirmar permiso concedido/denegado sin consultar capacidad real. |
| 07 Código no reconocido | Ausente. | Entrada de nombre/código manual útil sin depender de catálogo conectado. No simular búsqueda exitosa. |
| 08 Producto existente | Parcial funcional: Sheet duplicado en compra; revisión de ingredientes con mantener, separado y combinar cuando seguro. | Conservar decisiones/validación y adaptar visualmente; cantidades existentes/nuevas visibles antes de confirmar. La pantalla de estado no debe sustituir el mecanismo seguro. |
| 09 Confirmación | Parcial funcional: aviso con deshacer de mutaciones locales. | Estado/panel V2 reutilizable, acción deshacer real; pruebas de que deshacer no pisa cambios posteriores. No exigir un salto de pantalla para cada check si perjudica uso diario. |

Hay otros estados implementados que deben conservarse: cargando, error de lectura, fallo de guardado, idioma no persistido, borrador con cambios, formularios inválidos y fallos del menú. Sus mensajes no cubren automáticamente los cinco estados de capacidades/red ausentes.

## Diferencias de composición que explican la percepción del usuario

1. **El sistema de pantallas está incompleto.** La principal discrepancia no es un tono de verde: faltan siete interfaces y una subpantalla de presupuesto; receta y revisión tienen otro patrón de navegación.
2. **Inicio compacto cambia el orden.** `HomeList.tsx:17,34,48` mueve Continuar antes de Categorías cuando alto <750. En 375×667 se ve hero/campo/Continuar/Categorías y sólo parte del presupuesto; desaparecen las ideas del primer viewport. La referencia 374×754 muestra el orden campo/categorías/presupuesto/Continuar/ideas. Conviene verificar también 375×754 para aislar altura de composición y permitir scroll normal sin recortar texto.
3. **Mayor densidad administrativa en lista.** `HomeList.tsx:73–80` antepone selector, dos acciones y resumen financiero. En la canónica el primer producto aparece mucho antes. Se puede compactar con menú de acciones, sin eliminar capacidades.
4. **Menús pierde su acción principal inicial.** Personas, etiqueta de planificación, explicación y cinco tarjetas altas desplazan la revisión. Es un problema visible incluso a 430×932, altura mayor que el original.
5. **Receta e ingredientes son formularios modales extensos.** `MenuWorkspace.tsx:211–273` cubre capacidades útiles, pero la cabecera y cuatro pestañas quedan detrás de una capa. El CTA de receta sólo aparece después de pasos y aviso. Revisión fija su CTA pero sacrifica gran parte del área a seleccionar destino y un aviso largo. Las referencias son páginas compactas con continuidad de pestañas y bloques semánticos.
6. **Tipografía y espaciado son coherentes pero no calcados.** Se usa Manrope para todo, título 26/34, sección20 y cuerpo15; márgenes18, categorías72 de alto y botones54 (`ui.tsx`, `HomeList.tsx`). La referencia usa filas más compactas y más espacio útil. No reducir controles bajo44 ni forzar cadenas traducidas a una línea para igualar un PNG.
7. **Base cromática correcta.** `theme.ts` reproduce los HEX V2 principales y la aplicación es clara con encabezado verde y pestaña amarilla. El blanco del contenido coincide con la composición canónica; el moodboard propone más crema y fotografías, pero no debe desplazar V2.
8. **Sin prueba de error de codificación en las capturas inspeccionadas.** Acentos, ñ, alemán y texto de prueba con diacríticos aparecen bien. Esto es observación visual limitada, no certificación de todas las traducciones ni garantía de cero fallos.

## Marca y alcance visual adicional

El activo corriente `assets/brand/jj-logo-horizontal.png` conserva el recorte original aprobado; el informe remoto verifica SHA256 `ab7813942787048ff9a37ef86bce0b45bcf6e4a739e7427e679028e008c57596`. Eso acredita fidelidad del recorte horizontal, **no** entrega del paquete 2D/3D completo.

El brief pide todavía isotipo independiente, iconos de app, variantes claro/oscuro/mono, SVG editable fiel y transparente, prueba32/48/64/128/256/512, estados de toque/carga/error con movimiento reducido, y una demostración separada 2D/3D con pausa/reinicio y medición táctil/rendimiento. Los SVG históricos de B01/B02 no son evidencia de que el nuevo logo fuente esté vectorizado correctamente. La propuesta conceptual contiene variantes con hojas/círculos que su propio brief prohíbe adoptar como reemplazo sin aprobación. Mantener fuente oficial y entregar B01-L por su secuencia de revisión; no integrar 3D en esta corrección de cobertura.

## Qué es posible completar localmente sin backend

- Navegación a todas las vistas, Atrás coherente y cuatro pestañas, campana, fichas y pantallas adaptadas a cada idioma.
- Reutilizar CRUD/listas/presupuesto/menú; búsqueda entre productos locales con resultados reales y alternativa manual; ficha y revisión editable antes de confirmar.
- Favoritos de tiendas y preferencias locales opcionales, conservando textos sin catálogos/acuerdos.
- Presupuesto completo y estado Historial vacío. Registro manual de gasto real sólo con una nueva entidad local separada y migración aditiva revisada, sin tocar listas existentes ni convertir artículos marcados en gastos.
- Pantalla de notificaciones vacía y preferencias almacenadas localmente. Recordatorios reales del sistema exigen capacidad, permiso y pruebas específicas; no se activan por dibujar un interruptor.
- Voz/escáner visualmente completos con disponibilidad honesta y alternativa manual. Captura de micrófono/cámara únicamente cuando se implemente y pruebe realmente cada plataforma. No pedir permiso sólo para una maqueta.
- Componentes comunes de los nueve estados, con disparadores de revisión identificados y sin generar falsos errores de red, permisos o actividad.

## Galería de revisión frente a aplicación terminada

Una galería aislada que presente las 16 vistas y nueve estados resulta útil para cotejar píxeles/composición, comparar idiomas y obtener aprobación. **No completa rutas, CTA, edición, persistencia, cancelación, navegación Atrás ni permisos de la aplicación.** Tampoco bastan 25 PNG o enlaces a las referencias originales: eso conserva diseños recibidos, no los implementa.

Para declarar preparación visual completa hay que poder abrir las 16 vistas **como componentes reales** desde una navegación de revisión o del producto, con botones que conduzcan a una salida útil, y representar los nueve estados sin fingir servicios activos. Para declarar función completada hace falta además el flujo y pruebas adecuados. Una vista marcada Revisión visual puede usar datos de ejemplo aislados y no persistentes; el producto principal debe usar datos locales reales o vacío honesto. Las capacidades futuras deben indicarse explícitamente.

## Entregas pequeñas recomendadas

1. **Lote visual A:** shell de subpantallas/Atrás/campana, Mis tiendas, Presupuesto, Historial vacío y Notificaciones vacío; filas de Perfil/Ahorro conectadas. Sin entidades de gasto nuevas en este lote.
2. **Lote visual B:** búsqueda y detalle de producto locales, rutas manuales de voz/escáner, componente de estado y catálogo de revisión de los nueve estados. Auditoría de ambos lotes, seguridad y traducciones antes de publicar.
3. **Lote visual C:** pasar receta/revisión a páginas canónicas, raciones en detalle, bloques semánticos, CTA persistente; compactar Menús sin borrar los cinco días ni funcionalidades.
4. **Lote visual D:** pulido comparativo de bienvenida/Inicio/lista/Ahorro/Perfil en375×754 y430, cuatro idiomas, texto aumentado, teclado, safe areas y escritorio. Auditoría completa de C+D antes de publicar.
5. **Lote funcional separado:** gasto manual/historial, recordatorios, voz y escáner real según capacidades y especificación, con pruebas y migraciones; backend/IA/comercio siguen fuera mientras no se especifiquen y autoricen. Logo B01-L como entrega creativa independiente con aprobación de recursos2D antes de3D.

## Criterio de verificación que falta

El corpus local contiene120 imágenes: **10 vistas ×3 anchos ×4 idiomas**, no25 vistas/estados. Los diez nombres son welcome/home/list/savings/menus/recipe/review/profile/language/validation; los anchos375/430/1280. El remoto tiene12 capturas, sólo welcome/home/review por idioma. Su propio informe declara Chromium con viewport móvil, sin iPhone físico, Safari ni iOS nativo.

Hay que preparar una matriz por vista/estado de referencia con estado Implementado/Preparado visual/Pendiente, captura del componente real, origen de datos, flujo/CTA probado e idioma. Revisar al menos375×754 y430 y el tamaño pequeño ya usado; las 25 muestras deben poder revisarse en cuatro idiomas. Ninguna captura en Chromium permite declarar VoiceOver, Safari iPhone, Dynamic Type o ejecución iOS aprobados. Una garantía de “0 fallos” no sería sustentable; se pueden declarar los controles ejecutados, los problemas resueltos y los pendientes concretos.
