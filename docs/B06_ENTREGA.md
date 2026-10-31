# B06 — comparador piloto con procedencia

**Estado: B06 manual EN REVISIÓN, implementación verificada en web.** El propietario autorizó B06 mientras realiza sus pruebas de B05. Se conserva esa entrega y no se toma el avance como aprobación nativa.

## Alcance

Nuevo comparador desde Ahorro → Comparar formatos y fuentes. Cada observación contiene producto, marca, formato, calidad/variante, tienda, contenido del envase y unidad, precio opcional, fecha y procedencia obligatorias, y enlace opcional. Las referencias son aportaciones manuales; no hay scraping, consulta de tiendas ni acuerdos comerciales simulados.

Se muestran €/kg para masa, €/L para volumen y €/ud para unidades. El precio es el del envase completo, sin envío. Se ordena por proporciones exactas de enteros, aunque la pantalla redondea a céntimos; no se anuncia ahorro realizado ni el mejor precio de todo el mercado.

La coincidencia de producto, marca, formato y calidad debe ser declarada por el usuario. Se admiten tamaños distintos con dimensiones compatibles, como 500 g y 1 kg; no se equiparan masa, volumen o unidades. Cada excepción permanece visible con su motivo.

## Estados y confianza

- Aportado por ti: dato manual con precio y fecha de hasta siete días. No significa precio actual ni verificado.
- Antiguo: más de siete días; queda fuera del orden de comparación. Es una regla conservadora del piloto, no una garantía de vigencia de los registros más recientes.
- Sin precio u origen sin verificar: no se inventa un importe ni se usa en el orden.
- Demostración: identificada y excluida de la comparación, aunque tenga fecha reciente.
- Fuentes verificadas: no hay ninguna conectada. No se ofrece un control para atribuir esa condición a una entrada manual. Conectar una fuente autorizada exige su propia verificación e integración; no se implementa ni se simula aquí.

Los formularios rechazan fechas futuras nuevas. La lectura conserva fechas válidas aunque el reloj se atrase; esos datos se señalan y excluyen. La fecha de contexto se refresca al volver a la app y cada minuto, sin sustituir una referencia existente que envejece.

## Datos y conservación

Las observaciones usan `jjcompraintelwgiemt.price-observations.v1`, una clave independiente. No se modifican listas, presupuestos, menús ni comparaciones anteriores al guardar observaciones. El comparador de ofertas anterior sigue accesible y conserva su cálculo de precio más envío; no se migran sus registros atribuyéndoles fechas o formatos inventados.

La escritura se confirma antes de mostrar éxito. Un error conserva el formulario y el estado anterior. Los datos corruptos o de otra versión no se reemplazan; se permite reintentar su carga. Borrar requiere confirmación y ofrece deshacer antes de otra modificación guardada. El estado de observaciones se mantiene en la raíz para serializar escrituras incluso al navegar.

Copia previa: `archives/B00-B05-source-before-B06.zip`. Fuentes, entregables y capturas anteriores conservados. Sin nuevas dependencias, credenciales, backend, cuentas, pagos ni IA conectada. Git sigue sin estar operativo: no hay PR/commit que enlazar. Verde Mercado y M3 provisional continúan.

## Verificación

| Comprobación | Resultado |
|---|---|
| Código y reglas | TypeScript sin errores y **324 pruebas** correctas en nueve archivos. [Vitest](../design/b06/evidence/vitest-results.json). |
| Recorridos | **52/52 correctos** en escritorio 1280×1000 y móvil 390×844, sin omitidos ni inestabilidad. Incluyen 16 ejecuciones nuevas del piloto y los 36 recorridos anteriores. [Playwright](../design/b06/evidence/playwright-results.json). |
| Comparación | Conversión g/kg y ml/L, equivalencia declarada, datos antiguos/demo/desconocidos/sin precio, conflictos de calidad/unidad, persistencia y cambios de referencia. |
| Errores y límites | Fecha futura y enlace javascript rechazados; fallo de escritura conserva formulario; carga corrupta/versiones incompatibles no se reemplazan; borrar/confirmar/deshacer; las tres claves anteriores permanecen idénticas. |
| Frescura | El cambio de día se prueba con reloj controlado: una aportación de siete días pasa a antigua y se retira sin editar/recargar; conserva la referencia seleccionada. |
| Capturas | **41 capturas web**: 13 estados × tres tamaños CSS de iPhone (375×667, 390×844, 430×932), escala 2; dos estados con texto simulado al 130 %. Sin errores JavaScript ni desbordamientos detectados, sin cambios de datos en los contextos de revisión. [Galería](../design/b06/review.html) · [Informe](../design/b06/evidence/report.json). |
| Exportación | Web y paquetes Hermes iOS/Android generados correctamente. No son IPA/APK ni validación física. [Archivos](../design/b06/evidence/export-build.json). |
| Seguridad | Escaneo limitado de 28 archivos de aplicación sin coincidencias de formatos comunes de claves. No es una auditoría integral. [Escaneo](../design/b06/evidence/source-security.json). Dependencias sin cambios; avisos previos abiertos. |
| Conservación | Copia previa, relación de archivos cambiados y comprobación de entregables anteriores. [Preservación](../design/b06/evidence/preservation.json). |

Comandos para reproducir:

```sh
npm run check
npm run build:web
npx playwright install chromium
node scripts/verify-b06.cjs --all
```

El puerto 8081 debe estar libre. Para generar los tres paquetes: `npx expo export --platform all --max-workers 2`. Los precios de las capturas son ficticios y exclusivos del capturador; la aplicación no carga ejemplos automáticamente.

Las pruebas físicas del propietario no se atribuyen al entorno Linux; iPhone, teclado, VoiceOver, Dynamic Type y zonas seguras siguen pendientes de sus resultados.

Los avisos previos en herramientas de Expo permanecen abiertos. Este bloque no cambia dependencias y no los presenta como resueltos.

## Prueba rápida

1. Abrir Ahorro → Comparar formatos y fuentes.
2. Introducir dos observaciones de prueba del mismo producto, marca, bolsa y variedad: 500 g a 1,80 € y 1 kg a 3,00 €, con tiendas y procedencias claramente ficticias. Elegir Aportado por mí para comprobar el flujo manual; los valores de este ejercicio no son precios comerciales verificados.
3. Comprobar 3,60 €/kg frente a 3,00 €/kg, con tienda, fecha y procedencia visibles. Cambiar una calidad o unidad y verificar que deja de compararse.
4. Marcar una como Demostración o usar una fecha de más de siete días: debe excluirse. Dejar un precio vacío debe mostrarse como pendiente, no como cero.
5. Editar, borrar con confirmación, deshacer y recargar. Verificar que Mi compra y Menús conservan los datos usados en las pruebas de B05.

No se inicia B07 ni se publica una versión nueva sobre una prueba activa sin encargo.
