# Contrato visual definitivo V2 para Codex

## Decisiones no negociables
- Nombre: **JJ Compra Inteligente**. Identidad **Verde Mercado Premium**. No modificar el logo fuente ni crear una versión parecida.
- Estructura: **cuatro pestañas**: Inicio / Mi compra / Ahorro / Menús. Perfil desde avatar; Notificaciones desde campana; Mis tiendas y Presupuesto como subpantallas. Bienvenida no muestra barra inferior.
- Paleta canónica: verde profundo `#103F2D`; acción `#167347`; amarillo `#FFD24A`; crema `#FFF8E7`; verde pálido `#E6F1E6`; texto `#143E2C`; secundario `#566B5F`.
- Nombre de producto sobre fondo crema o blanco, **jamás amarillo sólido**. Usar amarillo para presupuesto, botones secundarios, selección o avisos pertinentes.
- La app debe funcionar en modo local sin cuenta. No afirmar sincronización, pagos, pedidos, ahorro real ni comparadores conectados antes de que existan.

## Estados y lenguaje de datos
1. `presupuestoConfigurado`: cantidad elegida por usuario; en maquetas `60 € · ejemplo`.
2. `gastoRealRegistrado`: total de pagos confirmados; inicialmente `sin registrar`. No deriva de selección de lista.
3. `costeEstimado`: solo si existen precios fiables y suficientes, con cobertura visible.
4. `precioProducto`: fuente, tienda, fecha, presentación y unidad verificadas; de lo contrario `Sin precio verificado`.
5. `ahorroEstimado`: solo al comparar equivalentes con fuentes verificadas y metodología explicable. Nunca deducirlo de una reducción de gasto entre semanas.
6. `popularidad/masComprado`, valor nutricional, alergias, origen y ofertas: no declarar sin fuente o consentimiento correspondiente.

## Accesibilidad y rendimiento, a validar en implementación
- Objetivos táctiles >=44x44 pt, contraste AA: texto normal 4.5:1, texto grande 3:1 y elementos esenciales 3:1.
- El contraste de referencia de `#143E2C` sobre crema es ~11.3:1; texto secundario `#566B5F` sobre crema ~5.41:1; blanco en verde de acción ~5.87:1. Esto no sustituye pruebas en todos los componentes.
- iPhone compacto + grande; Dynamic Type, VoiceOver, teclado, safe areas, orientación si aplica, reducir movimiento y disponibilidad offline.
- 2D en uso frecuente. Animación 3D en Bienvenida solo cuando esté aprobada y pueda omitirse. Nunca sustituir el logo original.

## Identidad de productos, listas y recetas
- Producto por peso ≠ unidad: unidades separadas; cantidades positivas, redondeo explícito y equivalencias verificables.
- `Ya lo tengo` excluye ingrediente de incorporación. `Ya en mi lista` abre revisión de cantidades. **Ninguna suma, eliminación, sustitución o cambio de lista es automático sin confirmar**.
- En error de red, evitar doble envío o duplicados. Permitir deshacer cuando sea posible.

## No publicado
Todas las nuevas pantallas son **referencias visuales**, no pruebas de pantallas funcionales. Tampoco se han vinculado supermercados ni registrado precios actuales.
