# JJ V3B | aquí se depositan los ZIP ligeros

**PENDIENTE:** subir los 11 ZIP V3B creados en ChatGPT; no están incluidos en este commit. Todos son menores de 11 MB.

No renombrar ni descomprimir. Ver instrucciones completas en [README_CODEX_V3B_LIGERO.md](../README_CODEX_V3B_LIGERO.md). Tras subirlos, Codex debe ejecutar:

```bash
python referencias/recetas/V3/verificar_y_preparar_v3b.py --input-dir referencias/recetas/V3/assets_v3b --verify-only
```

El verificador compara SHA-256, CRC, 150 fotos y 750 versiones lingüísticas. Prohibido fusionar hasta verificar.