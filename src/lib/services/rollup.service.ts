import {rollup, OutputOptions} from 'rollup';
import * as resolve from 'rollup-plugin-node-resolve';
import * as commonjs from 'rollup-plugin-commonjs';

import {ProjectService} from './project.service';

export {OutputOptions};

export class RollupService {
  constructor(private projectService: ProjectService) {}

  async getConfigs() {
    const {
      rollup: rollupConfigs = {},
    } = await this.projectService.getPackageJson();
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
    const {resolveConfigs, commonjsConfigs} = await this.getConfigs();
    const bundle = await rollup({
      input,
      plugins: [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (resolve as any)(resolveConfigs),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (commonjs as any)(commonjsConfigs),
      ],
    });
    for (const output of outputs) {
      await bundle.write(output);
    }
  }
}
