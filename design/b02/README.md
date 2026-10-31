# B02 · Pantallas y experiencia

**Para revisión visual. B03 no iniciado.** Dirección aprobada: Verde Mercado; M3 provisional, con el logo definitivo diferido por el propietario.

El proyecto de esta carpeta muestra cinco vistas y estados de diseño. La aplicación de fase 1 y B01 permanecen separados y conservados. No se han instalado dependencias ni añadido backend, IA, cuentas o persistencia.

## Revisar

- [PDF de siete páginas](evidence/B02-diseno.pdf).
- [Inicio, Mi compra y Ahorro](evidence/B02-pantallas.png).
- [Menús, Perfil y receta](evidence/B02-secundarias.png).
- [Galería HTML](review.html).
- [Mapa de navegación y componentes](../../docs/B02_FLUJOS_Y_COMPONENTES.md).
- [Checklist y límites de validación](../../docs/B02_CHECKLIST_USABILIDAD.md).

Se muestran datos de ejemplo. Los 60 € representan un presupuesto de muestra, no gasto ni ahorro. La escena de exceso utiliza 67,50 € como gasto de demostración. La observación antigua de 1,80 € está identificada como ficticia y fechada; no representa una oferta comercial.

## Ejecutar

Las dependencias se comparten con el proyecto principal. En un checkout nuevo, ejecutar antes `npm ci` en la raíz. No instalar otro juego de dependencias en esta carpeta.

```sh
cd design/b02
npm run web
```

Abrir `http://localhost:8084/`. El avatar abre Perfil. El control de ajustes de la cabecera permite explorar estados. La selección de estado es una herramienta de revisión; no registra decisiones del propietario.

Parámetros para reproducir vistas:

```text
?screen=home
?screen=list&state=empty
?screen=list&state=long-list
?screen=savings&state=stale-price
?screen=menus&sheet=recipe
?screen=list&sheet=review
?screen=profile&sheet=household
```

Pantallas: `home`, `list`, `savings`, `menus`, `profile`. Estados de revisión: `default`, `empty`, `loading`, `offline`, `mic-denied`, `error`, `long-list`, `no-price`, `over-budget`, `stale-price`, `incomparable`. Hojas: `add`, `review`, `recipe`, `household`, `budget`, `accessibility`, `privacy`.

## Qué se puede hacer en la maqueta

Navegar entre vistas, abrir/cerrar hojas, escribir en campos de ejemplo, cambiar cantidades/unidades, marcar productos de muestra, revisar/excluir/corregir ingredientes y cancelar antes de una confirmación visual. Todo vive solo en memoria: recargar recupera el ejemplo inicial. Confirmar no añade artículos a la aplicación real.

La revisión de texto muestra una propuesta prefijada de ejemplo. No interpreta el texto escrito ni llama a ChatGPT; las búsquedas siguen fuera de la app. Hogar representa un plan posterior y no envía invitaciones ni sincroniza datos.

## Reproducir capturas y controles

Node 24, dependencias del proyecto principal y Chromium de Playwright:

```sh
npm run typecheck
npm run export:web
npx playwright install chromium
node check-contrast.cjs
node capture.cjs
```

Para Chromium del sistema, indicar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. El entorno de trabajo usó `/usr/bin/chromium`. `B02_PORT` permite cambiar el puerto si 8084 está ocupado.

`capture.cjs` inicia un servidor estático temporal en localhost y lo cierra al terminar. Genera 57 vistas base (19 escenas × 3 tamaños), dos simulaciones de texto al 130 %, dos capturas al final del desplazamiento, las láminas y el PDF. También comprueba navegación, flujos de muestra, ausencia de escrituras locales, selección ARIA, desbordamiento del documento y texto visible fuera del ancho de pantalla.

```sh
node capture.cjs --serve
```

Sirve la exportación y `http://127.0.0.1:8084/review.html` para revisión local. No es un backend del producto. `--review-only` regenera PDF y láminas usando las capturas existentes.

## Límites de la evidencia

Capturas de Chromium web con viewports CSS 375×667, 390×844 y 430×932, a densidad 2×. **No son capturas de iPhone físico ni de iOS Safari.** El texto al 130 % se simula modificando tamaños de texto en memoria, no con Dynamic Type ni zoom de pantalla.

No se han validado teclado iOS real, VoiceOver/TalkBack, safe areas físicas o uso con pulgar. El prototipo usa SafeArea y KeyboardAvoidingView, pero tener esos componentes no demuestra la validación nativa. La persistencia, permisos reales y funcionamiento desconectado pertenecen a sus entregas posteriores.

Los controles de contraste verifican colores concretos, no certifican accesibilidad completa. El checklist distingue las comprobaciones web de las pendientes en dispositivo.

No hay rama, commit o PR porque la base local sigue sin un repositorio Git operativo. Se conserva el trabajo previo y no se inicializa otro repositorio. La aprobación de las pantallas corresponde al propietario antes de B03.
