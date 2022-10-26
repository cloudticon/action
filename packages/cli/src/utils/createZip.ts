import archiver from 'archiver';
import { createWriteStream } from 'fs';

export async function createZip(outPath: string, files: string[]) {
  const out = createWriteStream(outPath);
  const archive = archiver('zip');
  archive.pipe(out);

  for (const file of files) {
    archive.file(file, { name: file });
  }

  await new Promise<void>((resolve, reject) => {
    out.on('close', function() {
      resolve();
    });
    out.on('error', reject);
    archive.finalize();
  });
}
