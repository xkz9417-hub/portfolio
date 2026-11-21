import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDirectory = fileURLToPath(new URL('../dist/', import.meta.url));
const indexPath = fileURLToPath(new URL('../dist/index.html', import.meta.url));
const indexHtml = await readFile(indexPath, 'utf8');

for (let index = 1; index <= 13; index += 1) {
  const projectPath = join(outputDirectory, 'projects', String(index).padStart(2, '0'), 'index.html');
  await mkdir(dirname(projectPath), { recursive: true });
  await writeFile(projectPath, indexHtml);
}
