import chalk from 'chalk';
import { readJson, outputFile } from 'fs-extra';
import { basename, resolve } from 'path';
import { pascalCase } from 'change-case';

import { buildReadme } from '../../services/readme/readme.service';
import { BuildReadmeInput } from '../../services/readme/readme.type';

export interface Options {
    docs?: boolean;
}

export async function readmeCommand(nameExport?: string, options: Options = {}) {
    if (!nameExport) {
        const dotClaspDotJson = await readJson('.clasp.json');
        nameExport = dotClaspDotJson.exportName || basename(process.cwd());
    }
    const namePascalCase = pascalCase(nameExport);
    const src = resolve('.', 'src');
    const buildData: BuildReadmeInput = {
        src,
        names: {
            namePascalCase,
        },
        docs: options.docs,
    };

    try {
        const readmeContent = await buildReadme(buildData);
        await outputFile('README.md', readmeContent);
    } catch (error) {
        console.error(chalk.red('Errors building README.md content.\n'));
        console.error(error);
        return process.exit(1);
    }
    console.log(chalk.green('README.md ... saved!'));
    return process.exit();
}