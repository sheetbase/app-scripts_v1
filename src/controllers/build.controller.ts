import chalk from 'chalk';
import { resolve } from 'path';
import { remove, copy } from 'fs-extra';

export interface IOption {
    prod?: boolean;
}

export default async (options: IOption) => {
    // TODO: TODO
    // TODO: add production build

    const src = resolve('.', 'src');
    const dist = resolve('.', 'dist');

    // clean
    try {
        await remove(dist);
    } catch (error) {
        console.log(chalk.red('Errors cleaning dist folder.'));
        return process.exit(1);
    }
    
    // copy
    try {
        await copy(src, dist, {
            filter: (path: string) => {
                return (
                    (path.indexOf('index.ts') < 0 ||
                    path.indexOf('@index.ts') > -1) &&
                    path.indexOf('types') < 0 &&
                    path.indexOf('interfaces') < 0
                );
            }
        });
        await copy(`.clasp.json`, dist + '/.clasp.json');
        await copy(`appsscript.json`, dist + '/appsscript.json');
    } catch (error) {
        console.log(chalk.red('Errors copying files.'));
        return process.exit(1);
    }

    console.log(chalk.green('Build success!'));
    return process.exit();
}