import {resolve} from 'path';
import {
  pathExists,
  statSync,
  readJson as fsReadJson,
  copy as fsCopy,
  remove as fsRemove,
  readFile as fsReadFile,
  outputFile as fsOutputFile,
} from 'fs-extra';

export class FileService {
  constructor() {}

  async readFile(path: string) {
    return fsReadFile(path, 'utf-8');
  }

  async outputFile(path: string, content: string) {
    return fsOutputFile(path, content);
  }

  async readJson(path: string) {
    return fsReadJson(path);
  }

  async copy(sources: string[], destDir: string) {
    for (let src of sources) {
      src = src.replace(/\\/g, '/');
      const from = resolve(src);
      // the source must be available
      if (src !== '' && (await pathExists(from))) {
        const isDir = !!statSync(from).isDirectory();
        const to = resolve(
          destDir,
          isDir ? '' : (src.split('/').pop() as string)
        );
        await fsCopy(from, to);
      }
    }
  }

  async remove(path: string) {
    return fsRemove(path);
  }
}
