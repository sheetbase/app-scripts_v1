import { rollup, OutputOptions } from 'rollup';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

import { getPackageJson } from './project';

export { OutputOptions };

export async function getConfigs() {
  const { rollup: rollupConfigs = {} } = await getPackageJson();
  const {
    resolve: resolveConfigs = {},
    commonjs: commonjsConfigs = {},
  } = rollupConfigs;
  return {
    resolveConfigs,
    commonjsConfigs,
  };
}

export async function bundleCode(input: string, output: OutputOptions[]) {
  const { resolveConfigs, commonjsConfigs } = await getConfigs();
  const bundle = await rollup({
    input,
    plugins: [resolve(resolveConfigs), commonjs(commonjsConfigs)],
  });
  return output.forEach(option => bundle.write(option));
}
