# B05 | Menús y asistente IA
**Estado inicial:** PENDIENTE | **Dependencia:** B04 aprobado.
**Objetivo:** transformar frases y menús en lista editable de forma confiable.

## Encargo a Codex
1. Empezar por reglas deterministas: ingredientes de receta a cantidades/unidades revisables; normalizar duplicados.
2. Diseñar generación y edición de menús sin afirmar precios no sustentados.
3. Incorporar IA solo por servicio backend si se aprueba coste y arquitectura; respuestas estructuradas y validadas.
4. Para entrada por voz, informar permisos y ofrecer texto alternativo; no interrumpir el flujo si se deniega.
5. Antes de editar lista, mostrar «Esto he entendido» y permitir corregir/cancelar.
6. No almacenar entradas de voz o gustos sensibles sin decisión específica de privacidad.

## Entregables
PR por partes (menú deterministicamente funcional primero, IA después), demos y batería de entradas conflictivas.

## Aceptación
- [ ] Usuario puede cancelar toda sugerencia.
- [ ] No hay cambios silenciosos.
- [ ] Unidades, raciones y duplicados se manejan bien.
- [ ] Fallo IA no rompe compras locales.
- [ ] Coste por llamada y límites monitorizables.
