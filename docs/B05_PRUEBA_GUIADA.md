# B05 — prueba de menús a compra

Recorrido preparado para la prueba con el propietario. No representa una prueba nativa ya realizada.

## Abrir la app

En una carpeta nueva con el proyecto, Node.js 24 y npm:

```sh
npm install
npm start
```

En iPhone usa Expo Go compatible con SDK 58, o una compilación de desarrollo compatible. Ordenador y teléfono deben estar en la misma red para la conexión local; abre el QR que muestra Expo. Si Expo Go indica incompatibilidad de SDK, no actualizar versiones del proyecto al azar: registrar el mensaje y preparar una compilación compatible.

Para una primera prueba web se puede ejecutar `npm run web`. Sus datos son independientes del teléfono.

## Recorrido de 8 minutos

1. En Inicio crea una lista llamada «Prueba B05» y asigna un presupuesto de 40 €. Añade Arroz, 500 g, sin precio. Añade Leche, 1 L, precio introducido de 1,20 €, y márcala como comprada. Son datos de prueba introducidos por ti, no precios comerciales verificados.
2. Abre Menús y prepara cinco cenas para dos personas. Abre una receta y comprueba ingredientes y pasos. Ajusta a cuatro personas y cambia un plato. Vuelve a abrir la app: se deben conservar los platos y las personas.
3. Revisa los ingredientes del menú. Cambia una cantidad y excluye lo que ya tienes. Cancela la propuesta: la lista de compra debe permanecer idéntica.
4. Abre «Traer texto de ChatGPT» y pega este texto, sin búsquedas dentro de la app:

```text
0,5 kg arroz
2 L leche
3 huevos
```

5. En «Esto he entendido», comprueba el destino y las unidades. Para Arroz elige sumar cantidades: deben quedar 1000 g. Para Leche elige añadir por separado: la anterior debe conservar su precio y marcado; la nueva debe quedar pendiente y sin precio. Confirma. El presupuesto debe seguir siendo 40 €.
6. Pulsa Deshacer: debe retirarse toda esa incorporación, sin borrar los productos anteriores. Prueba también confirmar en una lista nueva; solo debe crearse después de confirmar.
7. Vuelve al texto y prueba «arroz al gusto». Debe pedir corrección sin importar una parte de la propuesta. Corrige la línea y continúa, o cancela.
8. Con la app ya cargada, activa modo avión y usa el catálogo local y Mi compra. Revisa también la persistencia al cerrar y reabrir después de reconectar. El arranque completo sin red requiere comprobar una compilación con el paquete incluido; Expo Go puede depender del servidor de desarrollo. Comprueba también texto grande, teclado abierto, botones inferiores y lectura con VoiceOver si está disponible.

## Qué registrar

Anotar modelo de iPhone, versión de iOS y Expo, paso, resultado esperado y observado. Revisar si la acción principal queda accesible con el teclado y si se pueden leer nombres largos y cantidades sin recortes. No se necesitan claves de API ni permisos de micrófono. El parser es local y limitado: pide un ingrediente por línea, no interpreta peticiones libres ni verifica alergias, precios o disponibilidad.

La app conserva solo la selección de recetas y personas, además de los productos que confirmes. El texto pegado no se guarda como historial. Las advertencias de dependencias de Expo y la validación nativa pendientes figuran en la entrega; esta prueba no equivale a publicar la app.
