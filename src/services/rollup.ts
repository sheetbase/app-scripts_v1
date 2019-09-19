import { rollup, OutputOptions } from 'rollup';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

import { ProjectService } from './project';

export { OutputOptions };

export class RollupService {

  private projectService: ProjectService;

  constructor(projectService: ProjectService) {
    this.projectService = projectService;
  }
    
  async getConfigs() {
    const { rollup: rollupConfigs = {} } = await this.projectService.getPackageJson();
    const {
      resolve: resolveConfigs = {},
      commonjs: commonjsConfigs = {},
    } = rollupConfigs;
    return {
      resolveConfigs,
      commonjsConfigs,
    };
  }

  async bundleCode(input: string, outputs: OutputOptions[]) {
    const { resolveConfigs, commonjsConfigs } = await this.getConfigs();
    const bundle = await rollup({
      input,
      plugins: [resolve(resolveConfigs), commonjs(commonjsConfigs)],
    });
    for(const output of outputs) {
      await bundle.write(output);
    }
  }

}
