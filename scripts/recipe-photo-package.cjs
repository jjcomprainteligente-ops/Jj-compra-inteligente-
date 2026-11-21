// Validate the exact local photo derivatives allowed in a web preview.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const variants = { thumbnail: 'thumbnails', detail: 'details' };

function expectedPhotoFiles(project) {
  const filename = path.join(project, 'referencias/recetas-v3/manifest-assets.json');
  const info = fs.lstatSync(filename);
  if (!info.isFile() || info.isSymbolicLink() || info.size > 512 * 1024 || fs.realpathSync(filename) !== filename) {
    throw new Error('The recipe-photo manifest must be a bounded regular source file.');
  }
  const bytes = fs.readFileSync(filename);
  const source = JSON.parse(bytes.toString('utf8'));
  if (source.schemaVersion !== 1 || !Array.isArray(source.photos) || source.photos.length !== 150 ||
      !/^[a-f0-9]{64}$/.test(source.source?.zipSHA256 ?? '') ||
      !/^[a-f0-9]{64}$/.test(source.source?.sidecarSHA256 ?? '')) throw new Error('Invalid recipe-photo manifest.');
  const expected = new Map();
  for (const photo of source.photos) {
    if (!/^JJ-[A-Z0-9-]{1,116}$/.test(photo.recipeId ?? '')) throw new Error('Invalid photo identity.');
    for (const [variant, directory] of Object.entries(variants)) {
      const resource = photo[variant];
      const key = directory + '/' + photo.recipeId;
      if (expected.has(key) || !resource || resource.path !== 'assets/recipes-v3/' + key + '.jpg' ||
          !/^[a-f0-9]{64}$/.test(resource.sha256 ?? '') || !Number.isSafeInteger(resource.bytes) ||
          resource.bytes <= 0 || resource.bytes > 1024 * 1024 ||
          !Number.isSafeInteger(resource.width) || resource.width <= 0 || resource.width > 960 ||
          !Number.isSafeInteger(resource.height) || resource.height <= 0 || resource.height > 960) {
        throw new Error('Invalid or duplicated photo derivative.');
      }
      expected.set(key, { ...resource, recipeId: photo.recipeId, variant });
    }
  }
  return { expected, source, manifestSHA256: sha256(bytes) };
}

function recipePhotoPackage(project, files) {
  const { expected, source, manifestSHA256 } = expectedPhotoFiles(project);
  const found = new Set();
  const photos = [];
  for (const file of files) {
    if (!/\.jpe?g$/i.test(file.file)) continue;
    const match = /^assets\/(?:assets\/)?recipes-v3\/(thumbnails|details)\/(JJ-[A-Z0-9-]+)\.[a-f0-9]{32}\.jpg$/.exec(file.file);
    if (!match) throw new Error('A JPEG outside the reviewed recipe assets cannot be published.');
    const key = match[1] + '/' + match[2];
    const approved = expected.get(key);
    if (!approved || found.has(key) || file.size !== approved.bytes || file.sha256 !== approved.sha256) {
      throw new Error('A compiled photo differs from its reviewed derivative.');
    }
    found.add(key);
    photos.push({ recipeId: approved.recipeId, variant: approved.variant, file: file.file,
      size: file.size, sha256: file.sha256, width: approved.width, height: approved.height });
  }
  if (found.size !== 300) throw new Error('The preview must contain all 300 reviewed photo derivatives.');
  return { schemaVersion: 1, recipes: 150, manifestSHA256, sourceZIP_SHA256: source.source.zipSHA256,
    sourceSidecarSHA256: source.source.sidecarSHA256, files: photos,
    totalBytes: photos.reduce((total, file) => total + file.size, 0) };
}

function verifyRecipePhotoPackage(project, record, files) {
  const expected = recipePhotoPackage(project, files);
  if (!record || Object.keys(expected).some(key => !own(record, key)) ||
      JSON.stringify(record) !== JSON.stringify(expected)) throw new Error('Packaged photo metadata differs from the reviewed assets.');
  return expected;
}

module.exports = { recipePhotoPackage, verifyRecipePhotoPackage };
