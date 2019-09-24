import { ContentService } from '../services/content';
import { FileService } from '../services/file';
import { MessageService } from '../services/message';
import { ProjectService } from '../services/project';
import { TypedocService } from '../services/typedoc';

export class DocsCommand {
  private contentService: ContentService;
  private fileService: FileService;
  private messageService: MessageService;
  private projectService: ProjectService;
  private typedocService: TypedocService;

  constructor(
    contentService: ContentService,
    fileService: FileService,
    messageService: MessageService,
    projectService: ProjectService,
    typedocService: TypedocService
  ) {
    this.contentService = contentService;
    this.fileService = fileService;
    this.messageService = messageService;
    this.projectService = projectService;
    this.typedocService = typedocService;
  }

  async docs() {
    // save readme
    await this.saveReadme();
    // save docs
    this.saveDocs();
    // done
    return this.messageService.logOk('Save README.md && API reference.');
  }

  /**
   * API reference
   */
  saveDocs() {
    return this.typedocService.generateDocs(['src'], 'docs');
  }

  /**
   * README.md
   */
  async saveReadme() {
    // configs
    const { EOL, EOL2X } = this.contentService;
    const {
      name: packageName,
      description,
      repository: { url: repoUrl },
      license,
    } = await this.projectService.getPackageJson();
    const githubUrl = repoUrl.replace('.git', '');
    const { name, umdName } = await this.projectService.getConfigs();
    // readme sections
    const {
      header: sectionHeader = '',
      top: sectionTop = '',
      bottom: sectionBottom = '',
      footer: sectionFooter = '',
    } = (await this.contentService.getReadmeSections()) as {
      header?: string;
      top?: string;
      bottom?: string;
      footer?: string;
    };
    // build content
    const optionsInterfaceMD = this.contentService.getOptionsInterfaceMD();
    const methodInfoMD = this.contentService.getMainClassFullMD();
    const routingInfoMD = this.contentService.getRoutingInfoFullMD(
      umdName || 'Module'
    );
    // sum-up content
    const output = this.contentService.formatMDContent(
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
    return this.fileService.outputFile('README.md', output);
  }
}
