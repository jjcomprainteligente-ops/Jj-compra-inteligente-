# Referencias GPT-6 V2 recuperadas y verificadas

**Fecha:** 31/10/2026. **Alcance de este documento:** recepción, integridad, precedencia visual y preparación de las entregas V01/V02. No certifica una implementación terminada ni una prueba en iPhone.

El propietario volvió a adjuntar los seis archivos solicitados para continuar la corrección de la maqueta. Los originales se conservan en `referencias/gpt6-v2/originales/`; las extracciones están en `referencias/gpt6-v2/extraidos/`. No se sustituyeron los diseños históricos ni los documentos anteriores.

## Integridad comprobada

El [manifiesto de recepción](../referencias/gpt6-v2/MANIFIESTO_RECEPCION_2026-10-31.json) registra tamaño y SHA-256 de los seis originales y sus 69 archivos extraídos. Se recalcularon y comprobaron las **75 entradas**.

| Original recibido | SHA-256 |
|---|---|
| `1-JJ_Logo_2D_3D_Para_Codex.zip` | `47367717fb3b2d8884e5efb0c5711e7b3562d8763212ffe05057f2907a27cd7f` |
| `2-AUDITORIA_V2_VERIFICACION.pdf` | `c1e7902c6f58a558d68037a70c0039ee02c9eb1c30a6aa14f0fe48d6913537fb` |
| `3-JJ_Compra_Inteligente_Fase2_Corregida_Auditoria_V2_Codex.zip` | `3b3a8628300b078073a98756bcfc5ef0df0554099fb2e76821b8c5c21d8e9f0a` |
| `4-JJ_16_PANTALLAS_CANONICAS_V2.png` | `4e2fe83e2991f17296e57a19f70a73bdb6641178dae0537c01814e2158dd2ebc` |
| `5-JJ_Compra_Inteligente_B02_Estilo_Premium.zip` | `2f113093d48a26194a09fd07be1a65c02653dec88caad6c978fac85afde859dd` |
| `6-JJ_Compra_Inteligente_Kit_Codex_Fase2.zip` | `7ce7023fe109176135996171b386b7afc65a6780472b27231c605bf8eb909390` |

Se comprobaron además:

- Las **16 pantallas canónicas** y los **nueve estados B03.14** están presentes. Todas las imágenes individuales miden **374 × 754 px**.
- El PDF externo y el incluido en el ZIP V2 son idénticos byte a byte; lo mismo ocurre con la composición externa de las dieciséis pantallas y su copia incluida.
- El PDF tiene ocho páginas y distingue 12 correcciones de diseño/documentación de seis validaciones pendientes: AUD-07, AUD-08, AUD-10, AUD-11, AUD-13 y AUD-15. No describe una app certificada.
- Los tres JPG del logo —paquetes de logo, Premium y V2— son idénticos: SHA-256 `7500541f32e14292c013d80f6c8bbc43af87a94a7b646103d6b20289bacb47d0`.

## Logo y discrepancia del hash anterior

La fuente aprobada es [LOGO_USUARIO_FUENTE_INALTERADA.jpg](../referencias/gpt6-v2/extraidos/v2/01_ACTIVOS/LOGO_USUARIO_FUENTE_INALTERADA.jpg), de 1448 × 1086 px. Sus formas no deben redibujarse para esta corrección visual.

El [recorte horizontal entregado](../referencias/gpt6-v2/extraidos/v2/01_ACTIVOS/LOGO_HORIZONTAL_RECORTADO_DE_ORIGINAL.png) mide 936 × 330 px. Su SHA-256 actual es:

`ab7813942787048ff9a37ef86bce0b45bcf6e4a739e7427e679028e008c57596`

Este valor **no coincide** con `c6aa4ebde1932d0c3953f30a6bc570a95178b7c37c85b59af46c5408927ed8b0`, anotado como antecedente en la conciliación anterior. El manifiesto visual recibido firma únicamente el JPG, no el recorte. Por ello no se atribuye al PNG actual la firma heredada ni se afirma que ambos binarios sean el mismo archivo.

La comprobación de píxeles sí confirma que el PNG actual es **exactamente** el rectángulo RGB `[254, 220, 1190, 550]` del JPG aprobado, sin escalado ni reconstrucción. Puede reutilizarse ese binario entregado conservando su hash real. No se ha generado una nueva imagen para esta verificación.

El icono del archivo `ICONO_REFERENCIA_NO_APROBADO_PARA_PRODUCCION.png` continúa siendo una referencia, no un icono de producción aprobado. El tablero 2D/3D es conceptual. Vectorizaciones, variantes monocromáticas, iconos y tratamientos 3D requieren su propia revisión; no se incorporan automáticamente por figurar dentro de un ZIP.

## Precedencia y límites de la corrección

1. La instrucción del propietario de continuar la actualización y hacerla corresponder con la maqueta rige el trabajo actual. La inspección y el diagnóstico inicial ya se realizaron; la recuperación de estos adjuntos resuelve la dependencia de archivos, no crea una nueva aprobación visual por sí sola.
2. El contrato [`02_CONTRATO_VISUAL_DATOS.md`](../referencias/gpt6-v2/extraidos/v2/04_DOCUMENTACION/02_CONTRATO_VISUAL_DATOS.md) y las vistas `extraidos/v2/02_VISTAS_CANONICAS/` son la referencia visual activa. El propio paquete V2 declara que sustituye los ZIP antiguos **como referencia**, conservando el historial.
3. El JPG aprobado y su recorte entregado fijan la marca 2D. No se usa el tablero conceptual para inventar una versión similar.
4. La dirección Premium y su moodboard aportan contexto. Sus HEX orientativos no reemplazan los tokens canónicos V2; el moodboard no es fuente de precios, ofertas, fotografías verificadas ni pantallas funcionales. Manrope, ya disponible en la app, figura como tipografía admisible en el brief Premium; Inter se identifica en el manifiesto como referencia sin archivos de fuente redistribuidos.
5. El brief B01-L describe una secuencia propia para nuevos recursos vectoriales, 3D y movimiento. Su exigencia de revisión se mantiene para esas propuestas. Esta entrega puede reutilizar la imagen 2D exacta y corregir las pantallas existentes sin desarrollar ese encargo adicional.
6. El kit inicial y las alternativas antiguas V1/V2/V3 permanecen como antecedentes. **«V2 Verde Noche» de B01 no es GPT-6 V2**. El `AGENTS.md` anidado en el kit es material histórico recibido y no sustituye el archivo operativo de la raíz.

La paleta canónica es `#103F2D` (verde profundo), `#167347` (acción), `#FFD24A` (amarillo), `#FFF8E7` (crema), `#E6F1E6` (verde pálido), `#143E2C` (texto) y `#566B5F` (secundario). Los nombres de productos se presentan sobre crema o blanco. Se mantienen cuatro pestañas y acceso a Perfil mediante avatar; Bienvenida no tiene barra inferior.

## Fidelidad visual y datos de la app

Las etiquetas de maqueta «Inicio A+B», «Vista de diseño · Sin datos reales», los productos de muestra y `60 € · ejemplo` identifican las referencias. No son valores que deban inyectarse en una instalación vacía. Las capturas comparables pueden usar datos ficticios explícitos en contextos de prueba; la app sigue mostrando los datos locales de la persona.

La implementación debe conservar los cuatro idiomas y su preferencia, EUR, cantidades exactas, confirmación de ingredientes, deduplicación, cancelación, deshacer y almacenamiento local. No se amplía esta corrección a cámara, voz, notificaciones reales, sincronización, pagos o fuentes comerciales.

El contrato define gasto real como pagos confirmados. Marcar productos no equivale a registrar un pago: si se conserva el importe calculado de artículos marcados, debe nombrarse como tal y mantenerse separado de «gasto real sin registrar». Una mejora visual no crea una entidad de pagos ni un historial.

La composición de 374 × 754 px sirve para comparar jerarquía, colores, agrupación y acciones. Se deben mantener texto legible, áreas táctiles de al menos 44 puntos, desplazamiento cuando sea necesario y adaptación a alemán/francés. Una captura de referencia no autoriza a cortar texto ni reducir controles para que todo quepa a la fuerza.

## Entregas y puertas de verificación

| Bloque | Resultado esperado | Comprobación antes de cerrar |
|---|---|---|
| V00 — recuperación | Originales conservados, manifiesto, hashes y fuente activa identificada. | 75 entradas íntegras; JPG, recorte y duplicados verificados; discrepancia del hash heredado documentada. |
| V01 — base visual | Logo 2D exacto, tokens canónicos, cabecera, bienvenida y navegación de cuatro pestañas. | Capturas comparables, contraste de controles reales, idiomas, navegación y adaptación a tamaños compactos/grandes. |
| V02 — pantallas existentes | Composición de Inicio, Mi compra, Ahorro, Menús, Perfil y detalles ya implementados, conservando las reglas actuales. | Regresiones de listas/recetas, estados y cancelación; importes correctamente nombrados; capturas es/en/de/fr sin pérdida de información. |
| Auditoría V01 + V02 | Revisión completa del par antes de entregar como terminado. | Archivos e historial preservados, fuentes e integridad de activos, pruebas, exportación, datos, accesibilidad y revisión de seguridad. Hallazgos abiertos documentados. |
| GitHub y preview | Código revisable y vista de prueba del mismo origen. | Commit visible primero en GitHub; Vercel `staging` protegido con metadatos del commit y comprobación remota antes de compartir. |

La revisión visual del propietario continúa siendo necesaria para aceptar el resultado. Pruebas web no sustituyen Safari/iPhone físico, VoiceOver, Dynamic Type, teclado o zonas seguras. Los avisos de dependencias ya registrados no se consideran resueltos por recuperar estos archivos.

## Revisión para conservar las referencias en GitHub

Se revisaron los 33 textos extraídos/manifiestos buscando patrones de credenciales, claves privadas y enlaces compartidos con secreto: no hubo coincidencias. El PDF no contiene JavaScript ni formularios; su extracción textual no mostró correos ni patrones de credenciales. Los JPG presentan metadatos de orientación/resolución y no mostraron etiquetas GPS en la revisión. No se encontraron enlaces simbólicos en la extracción.

Son comprobaciones acotadas, no una garantía absoluta. Los originales ZIP son documentación fuente de esta recepción y deben conservarse mediante una excepción específica a la exclusión general de artefactos ZIP; esa excepción no debe incluir copias privadas, compilaciones ni trazas del navegador. No es necesario subir archivos temporales de `/tmp` para mantener las referencias recuperadas.
