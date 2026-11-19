# Fotografías · recepción de las 127 recetas activas

[Manifiesto](MANIFIESTO_FOTOS_ACTIVAS_127.json): los 120 IDs V83 autorizados y los siete anteriores, sin fotos definitivas localizadas. No se publica un estado nuevo para las 30 recetas retenidas. Las imágenes de maquetas y capturas permanecen como referencias, sin convertirse en originales de platos.

Este manifiesto aún no está conectado a la app. No implica aprobación, derechos, correspondencia visual ni publicación de fotografías. El validador solo lee originales y comprueba integridad; los fixtures de sus pruebas viven en directorios temporales, sin recursos de prueba en el producto.

[Inventario y contrato de recepción](../../../docs/MAESTRO/BLOQUE04_FOTOGRAFIAS_Y_RECEPCION.md) · [validador](../../../scripts/validate-recipe-photos.py). Para imágenes reales se requiere el venv con Pillow 13.0.0 fijado por hashes; cualquier versión distinta falla antes de decodificar. El estado PENDIENTE nunca se convierte automáticamente en APROBADA.
