import { generateDocs } from '../services/typedoc';
import { getConfigs, getPackageJson, outputFile } from '../services/project';
import {
  EOL,
  EOL2X,
  formatMDContent,
  getReadmeSections,
  getOptionsInterfaceMD,
  getMainClassFullMD,
  getRoutingInfoFullMD,
} from '../services/content';
import { logOk } from '../services/message';

export async function docsCommand() {
  // save readme
  await saveReadme();
  // save docs
  saveDocs();
  // done
  return logOk('Save README.md && API reference.');
}

/**
 * API reference
 */
function saveDocs() {
  return generateDocs(['src'], 'docs');
}

/**
 * README.md
 */
async function saveReadme() {
  // configs
  const {
    name: packageName,
    description,
    repository: { url: repoUrl },
    license,
  } = await getPackageJson();
  const githubUrl = repoUrl.replace('.git', '');
  const { name, umdName } = await getConfigs();
  // readme sections
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
  // build content
  const optionsInterfaceMD = getOptionsInterfaceMD();
  const methodInfoMD = getMainClassFullMD();
  const routingInfoMD = getRoutingInfoFullMD(umdName || 'Module');
  // sum-up content
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
        `import { ${name} } from '${packageName}';`,
        '',
        `// 2. create an instance`,
        `const ${umdName} = ${name}(/* options */);`,
        '',
        `// 3. start using`,
        `const getOptions = ${umdName}.getOptions();`,
        `\`\`\``,
      ].join(EOL),
      `- Detail docs: <https://sheetbase.github.io/${name}>`,
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
  return outputFile('README.md', output);
}
