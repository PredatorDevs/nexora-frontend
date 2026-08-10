import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const distDirectory = path.resolve('dist');
const assetsDirectory = path.join(distDirectory, 'assets');
const maximumChunkBytes = 500 * 1024;

await access(path.join(distDirectory, 'index.html')).catch(() => {
  throw new Error('No existe dist/index.html. Ejecuta npm run build primero.');
});

const index = await readFile(path.join(distDirectory, 'index.html'), 'utf8');
const assets = await readdir(assetsDirectory);
const javascriptAssets = assets.filter((name) => name.endsWith('.js'));
const sourceMaps = assets.filter((name) => name.endsWith('.map'));

if (javascriptAssets.length < 2) {
  throw new Error(
    'El build no contiene división de código en múltiples chunks.',
  );
}
if (sourceMaps.length > 0) {
  throw new Error('El build de producción contiene source maps públicos.');
}
if (!/assets\/index-[\w-]+\.js/.test(index)) {
  throw new Error('index.html no referencia una entrada JavaScript con hash.');
}

const sizes = await Promise.all(
  javascriptAssets.map(async (name) => ({
    name,
    bytes: (await stat(path.join(assetsDirectory, name))).size,
  })),
);
const largest = sizes.sort((left, right) => right.bytes - left.bytes)[0];

if (largest.bytes > maximumChunkBytes) {
  throw new Error(
    `El chunk ${largest.name} pesa ${largest.bytes} bytes y supera el límite de ${maximumChunkBytes}.`,
  );
}

console.log(
  JSON.stringify(
    {
      chunks: javascriptAssets.length,
      largestChunk: largest.name,
      largestChunkKiB: Number((largest.bytes / 1024).toFixed(2)),
      sourceMaps: sourceMaps.length,
    },
    null,
    2,
  ),
);
