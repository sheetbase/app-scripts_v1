module.exports = (extra) => {
  return (options, templateService, contentService, projectService) => {
    const templateSections = {};
    // consts
    const { name: packageName } = projectService.PACKAGE;
    const name = packageName
      .split('/')
      .pop()
      .split('-')
      .map((x, i) => i === 0 ? x: (x.charAt(0).toUpperCase() + x.substr(1)))
      .join('');
    const varName = name + 'Module';
    const umdName = varName.charAt(0).toUpperCase() + varName.substr(1);
    // getting started
    templateSections['installation'] = [
      contentService.blockHeading('Installation', 2, 'installation'),
      contentService.blockText([
        `- Install: \`npm install --save ${packageName}\``,
        `- Usage:`,
        [
          `\`\`\`ts`,
          `// 1. import module`,
          `import { ${umdName} } from '${packageName}';`,
          '',
          `// 2. create an instance`,
          `export class App {`,
          '  // the object',
          `  ${varName}: ${umdName};`,
          '',
          '  // initiate the instance',
          `  constructor() {`,
          `    this.${varName} = new ${umdName}(/* options */);`,
          `  }`,
          `}`,
          `\`\`\``,
        ].join('\n')
      ]),
    ];
    // result
    return templateService.createRendering(templateSections, extra);
  }
}