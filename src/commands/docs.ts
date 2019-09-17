import { EOL } from 'os';
import { execSync } from 'child_process';

import {
  getPackageJson,
  getRollupOutputData,
  saveFile,
} from '../services/project';
import {
  formatMDContent,
  getReadmeSections,
  getOptionsInterfaceMD,
  getMainClassFullMD,
  getRoutingInfoFullMD,
} from '../services/content';
import { logOk } from '../services/message';

interface Options {
  typedoc?: string;
}

const EOL2X = EOL.repeat(2);

export async function docsCommand(options: Options) {
  /**
   * README.md
   */
  const {
    name: packageName,
    description,
    repository: { url: repoUrl },
    license,
  } = await getPackageJson();
  const packageEndpoint = packageName.split('/').pop() as string;
  const githubUrl = repoUrl.replace('.git', '');
  const { moduleName } = await getRollupOutputData();

  const {
    header: sectionHeader = '',
    top: sectionTop = '',
    bottom: sectionBottom = '',
    footer: sectionFooter = '',
  } = (await getReadmeSections()) as {
    header?: string;
    top?: string;
    bottom?: string;
    footer?: string;
  };

  const optionsInterfaceMD = getOptionsInterfaceMD();
  const methodInfoMD = getMainClassFullMD();
  const routingInfoMD = getRoutingInfoFullMD(moduleName || 'Module');

  const output = formatMDContent(
    [
      // head
      `# ${packageName}`,
      description,
      sectionHeader,
      `**Table of content**`,
      [
        `- [Install](#getting-started)`,
        `- [Options](#options)`,
        `- [Methods](#methods)`,
        `- [Routing](#routing)`,
      ].join(EOL),
      // content top
      sectionTop,
      // docs
      `## Getting started`,
      `- Install: \`npm install --save ${packageName}\``,
      `- Usage:`,
      [
        `\`\`\`ts`,
        `// 1. import constructor`,
        `import { ${packageEndpoint} } from '${packageName}';`,
        '',
        `// 2. create an instance`,
        `const ${moduleName} = ${packageEndpoint}(/* options */);`,
        '',
        `// 3. start using`,
        `const getOptions = ${moduleName}.getOptions();`,
        `\`\`\``,
      ].join(EOL),
      `- Detail docs: <https://sheetbase.github.io/${packageEndpoint}>`,
      `## Options`,
      optionsInterfaceMD,
      `## Methods`,
      methodInfoMD,
      `## Routing`,
      routingInfoMD,
      // content bottom
      sectionBottom,
      // foot
      `## License`,
      `**${packageName}** is released under the [${license}](${githubUrl}/blob/master/LICENSE) license.`,
      sectionFooter,
    ].join(EOL2X)
  );
  await saveFile('README.md', output);

  /**
   * API reference
   */
  const args =
    options.typedoc ||
    ' src --out docs --mode file --ignoreCompilerErrors' +
      ' --excludeNotExported --excludePrivate --excludeProtected' +
      ' --readme none';
  execSync('typedoc' + args, { stdio: 'ignore' });

  // done
  return logOk('Save README.md && generate API reference.');
}
