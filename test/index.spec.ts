// tslint:disable: no-any ban-ts-ignore
import rewiremock from 'rewiremock';

rewiremock.overrideEntryPoint(module);
export { rewiremock };

export interface MockedReturnsValues {
  [methodName: string]: any;
}

export async function getModuleRewired<T>(
  loader: () => Promise<T>,
  deps: {
    [path: string]: Function | {},
  } = {},
) {
  return rewiremock.around(
    loader,
    mock => {
      // mock dependencies
      for (const path of Object.keys(deps)) {
        const mocked = deps[path];
        if (mocked instanceof Function) {
          mock(() => import(path)).withDefault(mocked);
        } else {
          mock(() => import(path)).with(mocked);
        }
      }
    }
  );
}

export function setMockedReturnsValues<T>(obj: T, returnsValues: MockedReturnsValues) {
  for (const method of Object.keys(returnsValues)) {
    // @ts-ignore
    obj[`${method}MockedReturns`] = returnsValues[method];
  }
}
