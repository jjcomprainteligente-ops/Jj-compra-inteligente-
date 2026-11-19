# B04 | Lista de compra + presupuesto
**Estado inicial:** PENDIENTE | **Dependencia:** B03 aprobado.
**Objetivo:** terminar una compra organizada de 10+ productos sin internet ni registro obligatorio (si esta opción queda aprobada).

## Encargo a Codex
1. Implementar lista local persistente y creación/edición/eliminación/selección de artículos con unidades y cantidades.
2. Separar presupuesto, precio introducido por usuario, estimación y ausencia de precio.
3. Manejar productos repetidos, categorías y deshacer una eliminación/marcado cuando proceda.
4. No exigir supermercado asociado. Optimizar la edición con una mano, teclado y voz desactivada.
5. Añadir pruebas de persistencia entre sesiones y errores comunes.

## Entregables
PR pequeño, evidencia en iPhone y pruebas reproducibles con lista de 10 productos.

## Aceptación
- [ ] 10+ productos sobreviven reinicio.
- [ ] Cantidades/unidades y estados pueden editarse.
- [ ] Offline sin pérdida de lista.
- [ ] Sin precios falsos, sin gastos confundidos con presupuesto.
- [ ] Tests documentados.
