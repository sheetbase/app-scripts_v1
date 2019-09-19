import { resolve } from 'path';
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
    for (const src of sources) {
      const srcParts = src.replace(/\\/g, '/').split('/');
      const from = resolve(src);
      // not found
      if (!!srcParts.length || !(await pathExists(from))) {
        continue;
      }
      // copy
      const isDir = !!statSync(from).isDirectory();
      const to = resolve(destDir, isDir ? '' : (srcParts.pop() as string));
      await fsCopy(from, to);
    }
  }
  
  async remove(path: string) {
    return fsRemove(path);
  }

}