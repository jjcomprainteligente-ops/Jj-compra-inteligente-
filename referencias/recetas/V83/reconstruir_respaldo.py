#!/usr/bin/env python3
"""Reconstruye el ZIP original de cierre V83 y comprueba su integridad."""
from pathlib import Path
import hashlib
import zipfile

BASE = Path(__file__).resolve().parent
PARTS = BASE / "respaldo_partes"
OUTPUT = BASE / "JJ_BLOQUE2_V83_CIERRE_141_150_SABOR_APROBADO.zip"
EXPECTED = "eb4e1a1fd1afdeae32f95690499e9d59052f167aa339f15a441d94d4802893f9"
files = [PARTS / f"V83-CIERRE.zip.part{i:02d}" for i in range(1, 14)]
if not all(p.is_file() for p in files):
    missing = [str(p.name) for p in files if not p.is_file()]
    raise SystemExit(f"Faltan partes: {missing}")
digest = hashlib.sha256()
with OUTPUT.open("wb") as dest:
    for part in files:
        with part.open("rb") as source:
            while chunk := source.read(1024 * 1024):
                dest.write(chunk)
                digest.update(chunk)
actual = digest.hexdigest()
if actual != EXPECTED:
    OUTPUT.unlink(missing_ok=True)
    raise SystemExit(f"SHA-256 incorrecto: {actual} (esperado: {EXPECTED})")
with zipfile.ZipFile(OUTPUT) as z:
    bad = z.testzip()
    if bad:
        OUTPUT.unlink(missing_ok=True)
        raise SystemExit(f"Archivo interno del ZIP corrupto: {bad}")
    print(f"ZIP reconstruido: {OUTPUT.name}; {OUTPUT.stat().st_size} bytes")
    print(f"Elementos ZIP: {len(z.infolist())}; SHA-256: {actual}")
