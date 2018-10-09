import { readJSON, readdirSync, pathExists } from 'fs-extra';

import { INPMPackageDotJson } from './npm.type';
import { SHEETBASE_MODULE_FILE_NAME } from '../code/code.config';

export async function packageJson(path: string = '.'): Promise<INPMPackageDotJson> {
    return await readJSON(path + '/package.json');
}

export async function getSheetbaseDependencies(): Promise<string[]> {
    let paths: string[] = [];
    // load peer and dev dependencies to ignored when bundling
    const { peerDependencies } = await packageJson();
    const ignoreDependencies: string[] = await getSheetbasePeerDependenciesDependencies(
        Object.keys(peerDependencies || {})
    );
    const ignore = new RegExp('/' + ignoreDependencies.join('/|/') + '/', 'g');
    // loop through all packages and test for "sheetbase.module.ts"
    const packages: string[] = readdirSync('node_modules', { encoding: 'utf8' });
    for (let i = 0; i < packages.length; i++) {
        const packageName = packages[i];
        const packagePath = 'node_modules/' + packageName;
        // org scope
        if (packageName.substr(0, 1) === '@') {
            const packages: string[] = readdirSync(packagePath, { encoding: 'utf8' });
            for (let j = 0; j < packages.length; j++) {
                const packageName = packages[j];
                const pathToFile = `${packagePath}/${packageName}/${SHEETBASE_MODULE_FILE_NAME}`;
                if (await pathExists(pathToFile) && !ignore.test(pathToFile)) {
                    paths.push(pathToFile);
                }
            }
        } else {
            const pathToFile = `${packagePath}/${SHEETBASE_MODULE_FILE_NAME}`;
            if (await pathExists(pathToFile) && !ignore.test(pathToFile)) {
                paths.push(pathToFile);
            }
        }
    }
    return paths;
}

export async function getSheetbasePeerDependenciesDependencies(peerDependencies: string[]): Promise<string[]> {
    let resultDependencies: string[] = peerDependencies;
    for (let i = 0; i < peerDependencies.length; i++) {
        const dependency: string = peerDependencies[i];
        const { dependencies } = await packageJson(`./node_modules/${dependency}`);
        resultDependencies = resultDependencies.concat([... Object.keys(dependencies || {})]);
    }
    return resultDependencies;
}