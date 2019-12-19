module.exports = (extra) => {
  return (options, templateService, contentService, projectService) => {
    const templateSections = {};
    // consts
    const { name: packageName } = projectService.PACKAGE;
    const name = packageName.split('/').pop();
    const umdName = name.charAt(0).toUpperCase() + name.substr(1);
    // getting started
    templateSections['installation'] = [
      contentService.blockHeading('Installation', 2, 'installation'),
      contentService.blockText([
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
        ].join('\n')
      ]),
    ];
    // result
    return templateService.createRendering(templateSections, extra);
  }
}