import {FileService} from './services/file.service';
import {MessageService} from './services/message.service';
import {ProjectService} from './services/project.service';
import {RollupService} from './services/rollup.service';

export class Lib {
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
