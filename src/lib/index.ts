import { FileService } from './services/file';
import { MessageService } from './services/message';
import { ProjectService } from './services/project';
import { RollupService } from './services/rollup';

export class Main {
  fileService: FileService;
  messageService: MessageService;
  projectService: ProjectService;
  rollupService: RollupService;

  constructor() {
    this.fileService = new FileService();
    this.messageService = new MessageService();
    this.projectService = new ProjectService(this.fileService);
    this.rollupService = new RollupService(this.projectService);
  }
}
