#!/usr/bin/env python3
"""JJ Compra Inteligente V3: valida fotos individuales publicadas en GitHub, sin dependencias externas."""
import argparse
import hashlib
import json
import sys
import zipfile
from pathlib import Path

BASE = Path('referencias/recetas/V3/APP_LIGERO_10MB')
NEEDED = {'es', 'en', 'de', 'fr', 'bg'}


def sha_file(path):
    hasher = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hasher.update(block)
    return hasher.hexdigest()


def jpeg_dimensions(data):
    if data[:2] != b'\xff\xd8':
        raise ValueError('No es JPEG')
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
        n = int.from_bytes(data[p:p+2], 'big')
        if n < 2 or p + n > len(data):
            break
        if marker in (0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf):
            if n < 7:
                break
            return (int.from_bytes(data[p+5:p+7], 'big'), int.from_bytes(data[p+3:p+5], 'big'))
        p += n
    raise ValueError('No se pueden extraer dimensiones JPEG')


def verify(root):
    base = root / BASE
    manifest = json.loads((base/'MANIFIESTO_FOTOS_INDIVIDUALES_150.json').read_text('utf-8'))
    photos = manifest['photos']
    if len(photos) != 150 or len({x['recipe_id'] for x in photos}) != 150:
        raise ValueError('Manifiesto: no hay 150 IDs de fotos distintos')
    if len({x['path'] for x in photos}) != 150:
        raise ValueError('Manifiesto: rutas duplicadas')
    zmeta = manifest['data_zip']
    zpath = root / zmeta['path']
    if zpath.stat().st_size != zmeta['bytes'] or sha_file(zpath) != zmeta['sha256']:
        raise ValueError('ZIP de datos distinto o incompleto')
    with zipfile.ZipFile(zpath) as archive:
        corrupted = archive.testzip()
        if corrupted:
            raise ValueError('CRC erróneo dentro del ZIP: ' + corrupted)
        recipes = json.loads(archive.read('datos/recetas_150_5_idiomas_editorial_comercial_v3.json'))
        photo_manifest = json.loads(archive.read('datos/manifest_photos_150_SHA256_V3.json'))
    by_recipe = {x['recipe_id']: x for x in recipes}
    by_zip_photo = {x['recipe_id']: x for x in photo_manifest}
    ids = {x['recipe_id'] for x in photos}
    if len(recipes) != 150 or len(photo_manifest) != 150 or set(by_recipe) != ids or set(by_zip_photo) != ids:
        raise ValueError('IDs de fotos, recetas y manifiesto en ZIP no coinciden')
    seen_hashes = set()
    for record in photos:
        rid, relative = record['recipe_id'], record['path']
        if relative != str(BASE / 'fotos' / (rid + '.jpg')):
            raise ValueError('Ruta o ID fotográfico incoherente: ' + rid)
        path = root / relative
        data = path.read_bytes()
        h = hashlib.sha256(data).hexdigest()
        if len(data) != record['bytes'] or h != record['sha256']:
            raise ValueError('Fotografía incorrecta o alterada: ' + rid)
        if h in seen_hashes:
            raise ValueError('Fotografía duplicada: ' + rid)
        seen_hashes.add(h)
        width, height = jpeg_dimensions(data)
        if width < 1536 or height < 1024:
            raise ValueError('Resolución insuficiente: ' + rid)
        recipe = by_recipe[rid]
        link = recipe.get('photo') or {}
        zp = by_zip_photo[rid]
        if set(recipe.get('localized', {})) != NEEDED:
            raise ValueError('Faltan idiomas: ' + rid)
        if link.get('photo_path') != 'fotos/' + rid + '.jpg' or link.get('sha256') != h:
            raise ValueError('Vínculo receta-foto incorrecto: ' + rid)
        if zp.get('photo_archive_path') != link['photo_path'] or zp.get('sha256') != h:
            raise ValueError('Manifiesto dentro del ZIP incoherente: ' + rid)
        if (zp.get('width_px'), zp.get('height_px')) != (width, height):
            raise ValueError('Dimensiones no coinciden con ZIP: ' + rid)
    print('OK: 150 JPEG, 150 recetas, 5 idiomas, ID/sha256/ruta/dimensiones/CRC verificados.')
    print('Nota: NO certifica correspondencia visual de ingredientes ni seguridad de alérgenos.')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', type=Path, default=Path('.'), help='Raíz del repositorio GitHub')
    args = ap.parse_args()
    try:
        verify(args.root)
    except (ValueError, OSError, KeyError, zipfile.BadZipFile) as exc:
        print('ERROR:', exc, file=sys.stderr)
        sys.exit(1)