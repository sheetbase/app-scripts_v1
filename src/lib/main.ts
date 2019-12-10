import { FileService } from './services/file';
import { MessageService } from './services/message';
import { ProjectService } from './services/project';
import { RollupService } from './services/rollup';

export class Main {

  private fileService: FileService;
  private messageService: MessageService;
  private projectService: ProjectService;
  private rollupService: RollupService;

  constructor() {
    this.fileService = new FileService();
    this.messageService = new MessageService();
    this.projectService = new ProjectService(this.fileService);
    this.rollupService = new RollupService(this.projectService);
  }

  get File() {
    return this.fileService;
  }

  get Message() {
    return this.messageService;
  }

  get Project() {
    return this.projectService;
  }

  get Rollup() {
    return this.rollupService;
  }

}

export { Main as AppscriptsModule };