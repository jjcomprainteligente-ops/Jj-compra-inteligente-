#!/usr/bin/env python3
"""Comprueba los 11 ZIP V3B y los extrae solo a staging, sin tocar la app activa."""
import argparse
import hashlib
import json
import shutil
import struct
import sys
import tempfile
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
MANIFEST = HERE / "MANIFIESTO_ENTREGA_V3B_LIGERA.json"
RECIPE_PATH = "datos/recetas_150_5_idiomas_editorial_comercial_v3b.json"
PHOTO_MANIFEST_PATH = "datos/manifest_photos_150_SHA256_V3B.json"
LOCALES = {"es", "en", "de", "fr", "bg"}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def hash_file(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def jpeg_size(data):
    if not data.startswith(b"\xff\xd8"):
        raise ValueError("Formato diferente de JPEG")
    i = 2
    while i < len(data) - 10:
        if data[i] != 0xff:
            i += 1
            continue
        marker = data[i + 1]
        i += 2
        if marker in (0xd8, 0xd9) or 0xd0 <= marker <= 0xd7:
            continue
        if i + 2 > len(data):
            break
        length = struct.unpack(">H", data[i:i + 2])[0]
        if length < 2 or i + length > len(data):
            break
        if marker in (0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf):
            if length < 7:
                break
            height = struct.unpack(">H", data[i + 3:i + 5])[0]
            width = struct.unpack(">H", data[i + 5:i + 7])[0]
            return width, height
        i += length
    raise ValueError("Cabecera JPEG incompleta")


def verify(input_dir, output_dir, verify_only=False):
    master = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if len(master["files"]) != 11:
        raise ValueError("Se requieren 11 archivos ZIP")
    if not verify_only and output_dir.exists():
        raise ValueError("Destino existente; no sobrescribir " + str(output_dir))
    for item in master["files"]:
        source = input_dir / item["file"]
        if not source.is_file():
            raise FileNotFoundError(source)
        if source.stat().st_size != item["bytes"] or hash_file(source) != item["sha256"]:
            raise ValueError("Hash/tamaño incorrecto: " + item["file"])
        with zipfile.ZipFile(source) as z:
            corrupted = z.testzip()
            if corrupted is not None:
                raise ValueError("ZIP dañado: " + item["file"] + "/" + corrupted)

    with zipfile.ZipFile(input_dir / master["files"][0]["file"]) as z:
        recipes = json.loads(z.read(RECIPE_PATH))
        photos_meta = json.loads(z.read(PHOTO_MANIFEST_PATH))
    if len(recipes) != 150 or len(photos_meta) != 150:
        raise ValueError("Deben existir 150 recetas y 150 registros de foto")
    recipes_by_id = {}
    for recipe in recipes:
        rid = recipe["recipe_id"]
        if rid in recipes_by_id:
            raise ValueError("ID repetido de receta: " + rid)
        if set(recipe["localized"]) != LOCALES:
            raise ValueError("No hay cinco idiomas: " + rid)
        for lang, item in recipe["localized"].items():
            if item.get("recipe_id") != rid or item.get("language") != lang:
                raise ValueError("Idioma/ID discordante: " + rid + "/" + lang)
            if not item.get("ingredients") or not item.get("steps"):
                raise ValueError("Ficha incompleta: " + rid + "/" + lang)
        recipes_by_id[rid] = recipe

    manifest_by_id = {}
    for meta in photos_meta:
        rid = meta["recipe_id"]
        if rid in manifest_by_id:
            raise ValueError("ID repetido de foto: " + rid)
        manifest_by_id[rid] = meta
    if set(recipes_by_id) != set(manifest_by_id):
        raise ValueError("IDs de fotos y recetas no coinciden")

    image_bytes = {}
    for item in master["files"][1:]:
        with zipfile.ZipFile(input_dir / item["file"]) as z:
            filenames = [n for n in z.namelist() if n.startswith("fotos/") and n.lower().endswith(".jpg")]
            if len(filenames) != 15:
                raise ValueError("No hay 15 fotos en " + item["file"])
            for name in filenames:
                if Path(name).name != name.split("/")[-1] or ".." in Path(name).parts:
                    raise ValueError("Ruta insegura en " + item["file"])
                if name in image_bytes:
                    raise ValueError("Duplicado: " + name)
                image_bytes[name] = z.read(name)
    if len(image_bytes) != 150:
        raise ValueError("No se han recibido 150 archivos de imagen")

    photo_shas = set()
    for rid, recipe in recipes_by_id.items():
        info = manifest_by_id[rid]
        name = info["photo_archive_path"]
        if name != "fotos/" + rid + ".jpg":
            raise ValueError("Ruta con ID incorrecto: " + rid)
        if name not in image_bytes:
            raise ValueError("Falta foto: " + rid)
        data = image_bytes[name]
        sha = digest(data)
        if sha in photo_shas:
            raise ValueError("Imagen repetida: " + rid)
        photo_shas.add(sha)
        if sha != info["sha256"] or len(data) != info["bytes"]:
            raise ValueError("Hash/bytes incorrectos: " + rid)
        if recipe["photo"]["photo_path"] != name or recipe["photo"]["sha256"] != sha:
            raise ValueError("Vínculo receta-foto incorrecto: " + rid)
        width, height = jpeg_size(data)
        if (width, height) != (info["width_px"], info["height_px"]) or width < 1536 or height < 1024:
            raise ValueError("Resolución incorrecta: " + rid)

    print("PASS: 11 ZIP; 150 recetas, 750 fichas, 150 fotos distintas, JPEG >=1536x1024, SHA256 y vínculos")
    if verify_only:
        return

    output_dir.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix=".v3b-pending-", dir=output_dir.parent))
    try:
        (tmp / "fotos").mkdir()
        for name, data in image_bytes.items():
            (tmp / name).write_bytes(data)
        (tmp / "recetas_v3b.json").write_text(json.dumps(recipes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (tmp / "manifest_fotos_v3b.json").write_text(json.dumps(photos_meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (tmp / "ESTADO.txt").write_text(
            "STAGING: no modifica src/data/recipes.ts ni la app. "
            "Marcas, precios, SKU, etiquetas y trazas NO verificadas.\n",
            encoding="utf-8",
        )
        tmp.rename(output_dir)
        print("Staging creado: " + str(output_dir))
    finally:
        if tmp.exists():
            shutil.rmtree(tmp)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True, type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path("staging/jj-recetas-v3b"))
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    try:
        verify(args.input_dir, args.output_dir, args.verify_only)
    except (KeyError, ValueError, OSError, zipfile.BadZipFile) as e:
        print("BLOQUEADO: " + str(e), file=sys.stderr)
        sys.exit(1)
