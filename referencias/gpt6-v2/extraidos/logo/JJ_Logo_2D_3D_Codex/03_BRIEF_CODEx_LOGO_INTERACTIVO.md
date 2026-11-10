# JJ Compra Inteligente | B01-L: Logo oficial, 2D/3D e interacciones

**Estado:** diseño de logo elegido por el propietario; implementación pendiente de Codex.
**Responsabilidades:** ChatGPT define producto, dirección creativa y criterios de revisión. **Únicamente Codex escribe y modifica el código.**
**Prioridad:** preservar el diseño aprobado; optimizar rendimiento en iPhone; no desarrollar funcionalidades de compra en este encargo.

## 1. Fuente única de verdad

- `01_LOGO_ELEGIDO_REFERENCIA.jpg`: imagen **ELEGIDA Y APROBADA** por el propietario. Es la fuente principal de forma y composición.
- `02_PROPUESTA_VISUAL_2D_3D.png`: tablero **CONCEPTUAL**, que muestra tratamientos 2D y 3D, una propuesta de secuencia animada y ejemplos de aplicación. Puede contener variaciones que NO sustituyen la referencia aprobada.

### Elementos que no se pueden cambiar sin nueva aprobación

- Carrito amarillo dorado con silueta trapezoidal suavizada.
- Iniciales `JJ` verdes dentro del carrito, reconocibles a tamaño pequeño.
- Dos ruedas verdes circulares.
- Asa inclinada verde detrás del carrito.
- Dos destellos amarillos sobre la zona superior derecha.
- Nombre comercial exacto: **JJ Compra Inteligente** en verde oscuro, en dos líneas para el logo horizontal.
- Lenguaje visual `Verde Mercado`: verde profundo, amarillo cálido y fondo crema.

NO sustituir por bolsas, hojas, casas, checkmarks ni otros iconos. NO rediseñar la marca al construir su versión 3D. Evitar deformaciones o texto generado por IA en archivos finales.

## 2. Entregables del logo 2D

1. Logotipo principal horizontal, con símbolo a la izquierda y nombre a la derecha.
2. Isotipo independiente (carrito, JJ, asa, ruedas y destellos).
3. Icono de aplicación en fondo amarillo y variante adaptada al fondo verde.
4. Versiones sobre claro, oscuro y monocromática.
5. Recursos vectoriales editables SVG y versiones raster PNG transparentes, exportaciones optimizadas para web y iPhone.
6. Prueba de legibilidad a 32, 48, 64, 128, 256 y 512 px, respetando zonas de seguridad.

Los recursos vectoriales deben estar trazados o reconstruidos manualmente por Codex, con curvas limpias y proporciones fieles. No incrustar simplemente el JPEG como si fuera un SVG. Definir colores definitivos mediante muestras de la referencia; contrastar en fondos crema y verde oscuro. Evitar sombras o efectos decorativos en la versión base plana.

## 3. Entregables del logo 3D

1. Modelo 3D del mismo carrito y sus detalles, usando la versión 2D como plantilla fiel de proporciones.
2. Acabado premium pero sobrio: carro amarillo ligeramente satinado, iniciales verdes en relieve discreto, asa y ruedas verdes, destellos amarillos.
3. Cámara frontal/isométrica suave, sin deformar las JJ. Fondo crema o verde profundo.
4. Iluminación cálida, sombra de contacto ligera y material sin exceso de brillo.
5. Render frontal, tres cuartos e icono hero de onboarding.
6. Exportación o implementación apta para web móvil. Elegir técnica 3D real solo si el rendimiento lo justifica; proveer una imagen estática 2D como alternativa.

## 4. Interacciones 2D

- **Carga breve (1,2–1,8 s):** aparecen las ruedas, se dibuja el contorno del carrito, aparecen JJ, encaja el asa y los dos destellos se iluminan; finalmente aparece el nombre.
- **Toque:** rebote suave de 180–250 ms y destellos discretos; no provocar navegación ni compra por accidente.
- **Estados:** reposo, toque, carga y error; ninguna animación infinita innecesaria.
- **Accesibilidad:** con `prefers-reduced-motion`, mostrar el estado final sin transiciones de desplazamiento.

## 5. Interacciones 3D

- **Arrastrar con dedo:** rotación limitada y suave en horizontal y vertical; nunca dar vuelta completa si las JJ se vuelven ilegibles.
- **Toque:** ligera inclinación o rebote con regreso a posición inicial.
- **Control visible:** botones `2D`, `3D`, `Reiniciar` y `Pausar animación` con estados accesibles.
- **Transición entre modos:** 250–350 ms, sin destellos intensos ni movimientos bruscos.
- **Reducir movimiento y bajo rendimiento:** congelar render 3D y usar logo estático.
- **Eventos:** interacciones puramente visuales, sin crear carritos ni efectuar acciones comerciales.

## 6. Demostración web y Vercel

- Crear una pantalla independiente de demostración, sin cambiar la navegación principal de la app.
- Mostrar: pestañas 2D/3D; zona del logo; control de animación; vista horizontal; icono de app; muestras sobre fondo crema y verde.
- Asegurar táctil en Safari de iPhone, teclado, lector de pantalla y tamaño mínimo de controles de 44 puntos.
- Optimizar para pantalla estrecha, conexión móvil y baja potencia. Cargar el motor 3D solo cuando se seleccione 3D; evitar peso innecesario en la pantalla principal.
- Publicar como despliegue de previsualización en Vercel si el repositorio y permisos están disponibles. No tocar producción sin aprobación.

## 7. Orden estricto de ejecución para Codex

**B01-L.1 Auditoría, sin modificar código:** inspeccionar la estructura del repo, framework, recursos actuales, configuraciones de exportación y compatibilidad web. Presentar plan y riesgos.

**B01-L.2 Recursos 2D:** proponer SVG, iconos y pruebas de tamaño. Entregar capturas y esperar aprobación.

**B01-L.3 3D y movimiento:** construir vista aislada interactiva y medir rendimiento. Entregar capturas/grabación y esperar aprobación.

**B01-L.4 Vista de revisión:** desplegar preview en Vercel y proporcionar enlace comprobado y descripción de pruebas.

No realizar cambios irreversibles. Un commit o pull request por cada entrega aprobada. No añadir servicios de pago ni dependencias pesadas sin permiso.

## 8. Criterios de aceptación

- [ ] 2D mantiene formas y disposición de la referencia original.
- [ ] 3D se reconoce inmediatamente como el mismo logotipo, no una nueva marca.
- [ ] `JJ Compra Inteligente` está correctamente escrito en cualquier versión.
- [ ] Tamaños pequeños legibles, contrastes adecuados y fondo transparente donde corresponda.
- [ ] Funciona con el dedo en iPhone y con ratón en escritorio.
- [ ] Animaciones no bloquean navegación y admiten movimiento reducido.
- [ ] 3D tiene degradación elegante a 2D y no perjudica carga de la app.
- [ ] No se ha creado compra, pago ni sesión de usuario en esta fase.
- [ ] El usuario ha aprobado tanto el diseño 2D como 3D antes de integrar en la aplicación.

## 9. Prompt corto para iniciar Codex

> Trabaja en B01-L para JJ Compra Inteligente. Consulta este brief y utiliza `01_LOGO_ELEGIDO_REFERENCIA.jpg` como fuente visual obligatoria; el tablero `02_PROPUESTA_VISUAL_2D_3D.png` es solo inspiración. La marca elegida lleva carrito amarillo con `JJ` verdes, dos ruedas, asa verde inclinada y dos destellos. No rediseñes el símbolo. Primero ejecuta **solo B01-L.1: auditoría sin cambios**, describe el repositorio, propone implementación 2D + 3D interactiva para iPhone/web y un flujo de previsualización en Vercel. No programes ni hagas commits todavía. Espera autorización para B01-L.2.
