import chalk from 'chalk';
import { readJson, outputFile } from 'fs-extra';
import { basename, resolve } from 'path';
import { pascalCase } from 'change-case';

import { buildReadme } from '../services/readme/readme.service';
import { IBuildReadmeInput } from '../services/readme/readme.type';

export interface IOption {
    docs?: boolean;
}

export default async (nameExport: string = null, options: IOption = {}) => {
    if (!nameExport) {
        const dotClaspDotJson = await readJson('.clasp.json');
        nameExport = dotClaspDotJson.exportName || basename(process.cwd());
    }
    const namePascalCase = pascalCase(nameExport);
    const src = resolve('.', 'src');
    const buildData: IBuildReadmeInput = {
        src,
        names: {
            namePascalCase
        },
        docs: options.docs
    };

    try {
        const readmeContent = await buildReadme(buildData);
        await outputFile('README.md', readmeContent);
    } catch (error) {
        console.log(chalk.red('Errors building README.md content.\n'));
        console.log(error);
        return process.exit(1);
    }
    console.log(chalk.green('README.md ... saved!'));
    return process.exit();
}