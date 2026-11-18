#!/usr/bin/env python3
"""Verifica y prepara en staging V3. No modifica la app ni publica datos comerciales."""
import argparse
import hashlib
import json
import struct
import sys
import zipfile
from pathlib import Path

REQUIRED_LANGUAGES = {"es", "en", "de", "fr", "bg"}
RECIPES_JSON = "datos/recetas_150_5_idiomas_editorial_comercial_v3.json"
PHOTOS_JSON = "datos/manifest_photos_150_SHA256_V3.json"
EXPECTED_PHOTOS = 150


def digest(data):
    return hashlib.sha256(data).hexdigest()


def sha256_file(path):
    h = hashlib.sha256()
    with path.open("rb") as fp:
        for block in iter(lambda: fp.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def size_of_image(data):
    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24:
        return struct.unpack(">II", data[16:24])
    if data[:2] == b"\xff\xd8":
        p = 2
        while p + 4 < len(data):
            if data[p] != 0xff:
                p += 1
                continue
            marker = data[p + 1]
            p += 2
            if marker in (0xd8, 0xd9) or 0xd0 <= marker <= 0xd7:
                continue
            if p + 2 > len(data):
                break
            length = int.from_bytes(data[p:p + 2], "big")
            if length < 2 or p + length > len(data):
                break
            if marker in (0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf):
                if length < 7:
                    break
                return int.from_bytes(data[p + 3:p + 5], "big"), int.from_bytes(data[p + 5:p + 7], "big")
            p += length
    raise ValueError("Imagen PNG/JPEG ilegible")


def validate(args):
    manifest = json.loads((Path(__file__).parent / "APP_LIGERO_10MB/MANIFIESTO_APP_LIGERO_10MB.json").read_text(encoding="utf-8"))
    manifest["files"] = [{"name": manifest["recipe_data_zip"]["name"], "bytes": manifest["recipe_data_zip"]["size_bytes"], "sha256": manifest["recipe_data_zip"]["sha256"]}] + [{"name": r["filename"], "bytes": r["size_bytes"], "sha256": r["sha256"], "image_count": r["image_count"]} for r in manifest["parts"]]
    incoming = Path(args.input_dir)
    destination = Path(args.output_dir)
    if destination.exists():
        raise ValueError("El destino ya existe; se prohíbe sobrescribirlo: " + str(destination))

    # No confiar en el nombre del archivo, verificar cada ZIP completo primero.
    for record in manifest["files"]:
        source = incoming / record["name"]
        if not source.is_file():
            raise FileNotFoundError(str(source))
        if source.stat().st_size != record["bytes"] or sha256_file(source) != record["sha256"]:
            raise ValueError("ZIP modificado o incompleto: " + str(source))
        with zipfile.ZipFile(source) as z:
            corrupt = z.testzip()
            if corrupt is not None:
                raise ValueError("Error CRC en " + record["name"] + ": " + corrupt)

    data_zip = incoming / manifest["files"][0]["name"]
    with zipfile.ZipFile(data_zip) as z:
        recipes = json.loads(z.read(RECIPES_JSON))
        photo_manifest = json.loads(z.read(PHOTOS_JSON))
    if len(recipes) != 150 or len(photo_manifest) != 150:
        raise ValueError("El catálogo no contiene exactamente 150 recetas y 150 fotografías")

    recipe_by_id = {}
    for recipe in recipes:
        rid = recipe["recipe_id"]
        if rid in recipe_by_id:
            raise ValueError("Receta duplicada: " + rid)
        if set(recipe["localized"]) != REQUIRED_LANGUAGES:
            raise ValueError("Idiomas incompletos: " + rid)
        for lang, item in recipe["localized"].items():
            if item["recipe_id"] != rid or item["language"] != lang:
                raise ValueError("ID/idioma incoherente: " + rid + " " + lang)
            if not item.get("ingredients") or not item.get("steps"):
                raise ValueError("Receta incompleta: " + rid + " " + lang)
        recipe_by_id[rid] = recipe

    photo_by_id = {}
    for photo in photo_manifest:
        rid = photo["recipe_id"]
        if rid in photo_by_id:
            raise ValueError("Foto duplicada: " + rid)
        photo_by_id[rid] = photo
    if set(recipe_by_id) != set(photo_by_id):
        raise ValueError("Los IDs de recetas y fotografías no coinciden")

    photo_buffers = {}
    photos_seen = set()
    photo_shas_seen = set()
    for record in manifest["files"][1:]:
        with zipfile.ZipFile(incoming / record["name"]) as z:
            members = [name for name in z.namelist() if name.startswith("fotos/") and name.lower().endswith((".png", ".jpg", ".jpeg"))]
            if len(members) != record["image_count"]:
                raise ValueError("Número de fotos no coincide con el manifiesto: " + record["name"])
            for name in members:
                if name in photos_seen:
                    raise ValueError("Ruta fotográfica duplicada: " + name)
                photos_seen.add(name)
                photo_buffers[name] = z.read(name)

    if len(photo_buffers) != EXPECTED_PHOTOS:
        raise ValueError("No hay 150 fotografías individuales")

    for rid, recipe in recipe_by_id.items():
        expected = photo_by_id[rid]
        relative = expected["photo_archive_path"]
        if relative not in photo_buffers:
            raise ValueError("Falta foto para " + rid)
        if not relative.startswith("fotos/" + rid + "."):
            raise ValueError("Foto con ID incorrecto: " + rid)
        record = recipe.get("photo") or {}
        if record.get("photo_path") != relative or record.get("sha256") != expected["sha256"]:
            raise ValueError("Vínculo receta-foto incorrecto: " + rid)
        data = photo_buffers[relative]
        actual_sha = digest(data)
        if actual_sha != expected["sha256"] or len(data) != expected["bytes"]:
            raise ValueError("Hash o bytes incorrectos para " + rid)
        if actual_sha in photo_shas_seen:
            raise ValueError("Una foto se ha repetido en distintas recetas: " + rid)
        photo_shas_seen.add(actual_sha)
        width, height = size_of_image(data)
        if (width, height) != (expected["width_px"], expected["height_px"]):
            raise ValueError("Resolución distinta del manifiesto: " + rid)
        if width < 1536 or height < 1024:
            raise ValueError("Resolución insuficiente: " + rid)

    if args.verify_only:
        print("OK: 150 recetas, cinco idiomas, 150 imágenes distintas, IDs, dimensiones, CRC y SHA-256")
        return
    # Escribir únicamente en una carpeta NUEVA de staging tras pasar todas las verificaciones.
    destination.mkdir(parents=True)
    (destination / "fotos").mkdir()
    for relative, data in photo_buffers.items():
        (destination / relative).write_bytes(data)
    (destination / "recetas_v3_app_ligero.json").write_text(json.dumps(recipes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (destination / "manifest_fotos_v3_app_ligero.json").write_text(json.dumps(photo_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (destination / "ESTADO.txt").write_text(
        "STAGING V3 JPEG ligero verificado. NO integrado en src/data/recipes.ts. "
        "NO verificadas etiquetas/SKU/precios ni ausencia de trazas.\n",
        encoding="utf-8",
    )
    print("OK: staging V3 creado en " + str(destination))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True, help="Carpeta con los once ZIP ligeros V3 sin renombrar")
    parser.add_argument("--output-dir", default="staging/jj-recetas-v3-app-ligero")
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    try:
        validate(args)
    except (ValueError, FileNotFoundError, KeyError, zipfile.BadZipFile, OSError) as error:
        print("BLOQUEADO: " + str(error), file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
