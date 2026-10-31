# Estado técnico y recuperación del proyecto

**Fecha:** 2026-10-31  
**Proyecto:** JJ Compra Inteligente (Tenerife)  
**Este documento es una auditoría, NO el código fuente de la app.**

## Identificadores verificados

- Repositorio: `jjcomprainteligente-ops/Jj-compra-inteligente-`
- Rama principal: `main`
- Proyecto existente en Vercel: `jj-compra-inteligente`
- ID del proyecto Vercel: `prj_6LgoBqJOykuqz8M1RHmbN7XfUiry`
- Producción: https://jj-compra-inteligente.vercel.app
- Último despliegue de pruebas encontrado: `dpl_EijJvk6xY9bKAAS2EaYc9exGweNo`
- Despliegue de producción encontrado: `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3`

## Hallazgos

- El repositorio fue inicializado con un README.
- La web actual está desplegada en Vercel con artefactos de Expo / React Native Web.
- Los archivos accesibles del despliegue son artefactos web compilados, no el proyecto editable original.
- No se ha identificado el directorio original con `package.json`, `app/` o `src/` y sus recursos.
- La conexión Git de Vercel con este repositorio no aparece aún confirmada.

## Para continuar sin perder lo que funciona

1. Localizar los archivos fuente originales del proyecto Expo.
2. Subir el proyecto completo a esta rama usando un flujo revisado (PR recomendado).
3. Verificar dependencias, pruebas y compilación web en un entorno aislado.
4. Conectar al proyecto existente de Vercel, sin crear duplicados ni sustituir el dominio de producción.
5. Validar una URL de vista previa antes de promocionar a producción.

## Seguridad y decisiones de producto

- Nunca incluir tokens, contraseñas, variables `.env` ni credenciales.
- No presentar precios, ofertas o ahorros inventados como reales.
- Respetar la identidad verde de la marca y las decisiones visuales ya documentadas.
- No afirmar que la app está terminada por el mero hecho de que un despliegue figure como `READY`.
