/**
 * Static review metadata for the seven pre-existing legacy recipes.
 * Snapshot source: daa3f09a02f16c72a700b1a3d3d54888a67e2179.
 * Preserves the existing four vegan, two vegetarian and one unrestricted
 * ingredient classifications; it is not a new dietary or allergy approval.
 * Signatures bind the measured/unmeasured ingredients, editorial conditions,
 * steps and allergen note. Source changes require an explicit review update.
 * No catalogue imports or automatic runtime regeneration: no visible UI copy.
 */
export const LEGACY_DIETARY_REVIEWS: readonly Readonly<{
  id: string;
  preference: 'any' | 'vegetarian' | 'vegan';
  signature: string;
}>[] = [
  {
    "id": "arroz-verduras",
    "preference": "vegan",
    "signature": "[[\"measured\",[\"[\\\"aceite de oliva\\\",20000,\\\"ml\\\",\\\"Despensa\\\",\\\"\\\"]\",\"[\\\"agua\\\",400000,\\\"ml\\\",\\\"Otros\\\",\\\"Puedes omitirla de la compra si usas agua de casa.\\\"]\",\"[\\\"arroz\\\",160000,\\\"g\\\",\\\"Despensa\\\",\\\"\\\"]\",\"[\\\"calabacin\\\",200000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\",\"[\\\"cebolla\\\",100000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\",\"[\\\"zanahoria\\\",150000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\"]],[\"unmeasured\",[]],[\"editorial\",[]],[\"steps\",[\"Lava las verduras y córtalas en trozos pequeños.\",\"Sofríe la cebolla con el aceite; incorpora la zanahoria y el calabacín.\",\"Añade el arroz y el agua. Cocina siguiendo el tiempo y la proporción de líquido indicados en el envase, ajustando si hace falta.\",\"Deja reposar unos minutos y sirve.\"]],[\"allergenNote\",\"Revisa el etiquetado y las posibles trazas de cada ingrediente.\"]]"
  },
  {
    "id": "lentejas-casa",
    "preference": "vegan",
    "signature": "[[\"measured\",[\"[\\\"aceite de oliva\\\",20000,\\\"ml\\\",\\\"Despensa\\\",\\\"\\\"]\",\"[\\\"agua\\\",700000,\\\"ml\\\",\\\"Otros\\\",\\\"Puedes omitirla de la compra si usas agua de casa.\\\"]\",\"[\\\"cebolla\\\",100000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\",\"[\\\"lentejas secas\\\",180000,\\\"g\\\",\\\"Despensa\\\",\\\"\\\"]\",\"[\\\"papas\\\",250000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\",\"[\\\"zanahoria\\\",150000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\"]],[\"unmeasured\",[]],[\"editorial\",[]],[\"steps\",[\"Prepara las lentejas según las instrucciones de su envase; el remojo depende de la variedad.\",\"Lava y corta las verduras y las papas.\",\"Sofríe la cebolla con el aceite. Añade las lentejas, las verduras y el agua.\",\"Cuece hasta que las lentejas y las papas estén tiernas, siguiendo el envase y añadiendo agua si es necesario.\"]],[\"allergenNote\",\"Comprueba las posibles trazas de las legumbres y los demás envases.\"]]"
  },
  {
    "id": "tortilla-ensalada",
    "preference": "vegetarian",
    "signature": "[[\"measured\",[\"[\\\"aceite de oliva\\\",20000,\\\"ml\\\",\\\"Despensa\\\",\\\"\\\"]\",\"[\\\"huevos\\\",3000,\\\"ud\\\",\\\"Lácteos y huevos\\\",\\\"\\\"]\",\"[\\\"lechuga\\\",100000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\",\"[\\\"papas\\\",300000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\",\"[\\\"tomate\\\",150000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\"]],[\"unmeasured\",[]],[\"editorial\",[]],[\"steps\",[\"Lava la lechuga y el tomate y prepara la ensalada.\",\"Pela las papas, córtalas finas y cocínalas con el aceite hasta que estén tiernas.\",\"Bate los huevos y mézclalos con las papas.\",\"Cuaja la tortilla por ambos lados, comprobando que el huevo esté bien cocinado. Acompaña con la ensalada.\"]],[\"allergenNote\",\"Contiene huevo. Revisa también las etiquetas y las posibles trazas.\"]]"
  },
  {
    "id": "garbanzos-calabaza",
    "preference": "vegan",
    "signature": "[[\"measured\",[\"[\\\"aceite de oliva\\\",20000,\\\"ml\\\",\\\"Despensa\\\",\\\"\\\"]\",\"[\\\"calabaza\\\",300000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\",\"[\\\"cebolla\\\",100000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\",\"[\\\"garbanzos cocidos\\\",400000,\\\"g\\\",\\\"Despensa\\\",\\\"Cantidad escurrida.\\\"]\",\"[\\\"tomate\\\",150000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\"]],[\"unmeasured\",[]],[\"editorial\",[]],[\"steps\",[\"Lava las verduras; pela la calabaza y córtala en dados pequeños.\",\"Sofríe la cebolla con el aceite y añade el tomate troceado.\",\"Incorpora la calabaza y cocina tapado hasta que esté tierna; añade un poco de agua si hace falta.\",\"Añade los garbanzos cocidos escurridos y calienta el conjunto.\"]],[\"allergenNote\",\"Revisa el etiquetado de los garbanzos cocidos y sus posibles trazas.\"]]"
  },
  {
    "id": "pasta-tomate",
    "preference": "vegetarian",
    "signature": "[[\"measured\",[\"[\\\"aceite de oliva\\\",20000,\\\"ml\\\",\\\"Despensa\\\",\\\"\\\"]\",\"[\\\"cebolla\\\",100000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\",\"[\\\"pasta\\\",180000,\\\"g\\\",\\\"Despensa\\\",\\\"\\\"]\",\"[\\\"queso rallado\\\",30000,\\\"g\\\",\\\"Lácteos y huevos\\\",\\\"\\\"]\",\"[\\\"tomate\\\",300000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\"]],[\"unmeasured\",[]],[\"editorial\",[]],[\"steps\",[\"Lava y trocea los tomates y la cebolla.\",\"Sofríe la cebolla con el aceite; añade el tomate y cocina hasta obtener una salsa.\",\"Cuece la pasta en agua siguiendo el tiempo indicado en el envase y escúrrela.\",\"Mezcla la pasta con la salsa y sirve con el queso rallado.\"]],[\"allergenNote\",\"La pasta puede contener gluten o huevo; el queso contiene leche. Comprueba todos los envases.\"]]"
  },
  {
    "id": "pollo-papas",
    "preference": "any",
    "signature": "[[\"measured\",[\"[\\\"aceite de oliva\\\",20000,\\\"ml\\\",\\\"Despensa\\\",\\\"\\\"]\",\"[\\\"cebolla\\\",100000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\",\"[\\\"papas\\\",400000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\",\"[\\\"pollo\\\",300000,\\\"g\\\",\\\"Carne y pescado\\\",\\\"\\\"]\",\"[\\\"zanahoria\\\",150000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\"]],[\"unmeasured\",[]],[\"editorial\",[]],[\"steps\",[\"Lava, pela y corta las verduras y las papas.\",\"Coloca el pollo y las verduras en una fuente de horno con el aceite.\",\"Hornea hasta que las papas estén tiernas y el pollo esté completamente cocinado; ajusta el tiempo al tamaño de las piezas y sigue las indicaciones del envase.\",\"Utiliza utensilios limpios para servir y comprueba la cocción antes de comer.\"]],[\"allergenNote\",\"Comprueba etiquetas, marinados y posibles trazas. Separa los utensilios de pollo crudo de los alimentos listos para comer.\"]]"
  },
  {
    "id": "cuscus-verduras",
    "preference": "vegan",
    "signature": "[[\"measured\",[\"[\\\"aceite de oliva\\\",20000,\\\"ml\\\",\\\"Despensa\\\",\\\"\\\"]\",\"[\\\"agua\\\",200000,\\\"ml\\\",\\\"Otros\\\",\\\"Puedes omitirla de la compra si usas agua de casa.\\\"]\",\"[\\\"calabacin\\\",200000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\",\"[\\\"cuscus\\\",160000,\\\"g\\\",\\\"Despensa\\\",\\\"\\\"]\",\"[\\\"garbanzos cocidos\\\",200000,\\\"g\\\",\\\"Despensa\\\",\\\"Cantidad escurrida.\\\"]\",\"[\\\"zanahoria\\\",150000,\\\"g\\\",\\\"Fruta y verdura\\\",\\\"\\\"]\"]],[\"unmeasured\",[]],[\"editorial\",[]],[\"steps\",[\"Lava y corta las verduras en trozos pequeños.\",\"Saltéalas con el aceite hasta que estén tiernas y añade los garbanzos cocidos escurridos.\",\"Hidrata el cuscús con agua siguiendo la proporción y el tiempo del envase.\",\"Separa los granos con un tenedor y mezcla con las verduras.\"]],[\"allergenNote\",\"El cuscús de trigo contiene gluten. Revisa etiquetas y posibles trazas de todos los ingredientes.\"]]"
  }
];
