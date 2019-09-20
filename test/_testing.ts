// tslint:disable: no-any ban-ts-ignore
import _rewiremock from 'rewiremock';
import * as sinon from 'sinon';

export interface MockedReturnsValues {
  [method: string]: any;
}

export type ModuleLoader<Module> = () => Promise<Module>;

export interface ModuleMockedDeps {
  [modulePath: string]: Function | {};
}

export interface ServiceMockedDeps {
  [serviceName: string]: any;
}

export interface MethodStubs {
  [serviceName: string]: Function | {};
}

export interface StubedMethods {
  [methodName: string]: sinon.SinonStub;
}

export function setMockedReturnsValues<MockedService>(
  mockedService: MockedService,
  returnsValues: MockedReturnsValues,
) {
  for (const method of Object.keys(returnsValues)) {
    // @ts-ignore
    mockedService[`${method}Returns`] = returnsValues[method];
  }
}

export interface MockBuilderMethods {
  [methodName: string]: '*' | Function;
}

export function buildMock<DefaultMethods>(
  defaultMethods: DefaultMethods,
  methods: MockBuilderMethods = {},
) {
  return new MockBuilder<DefaultMethods>(defaultMethods, methods);
}

export class MockBuilder<DefaultMethods> {

  private returns: {
    [key in keyof MockBuilderMethods]: '*' | Function;
  } = {};
  private args: {
    [key in keyof MockBuilderMethods]: any[];
  } = {};
  private argsStack: {
    [key in keyof MockBuilderMethods]: any[][];
  } = {};

  constructor(
    defaultMethods: DefaultMethods,
    methods: MockBuilderMethods = {},
  ) {
    methods = { ...defaultMethods, ...methods };
    // set returns
    this.returns = methods;
    // set methods
    for (const methodName of Object.keys(methods)) {
      // @ts-ignore
      this[methodName] = (...args: any[]) => {
        // set args
        this.args[methodName] = args;
        // set args stack
        if (!this.argsStack[methodName]) {
          this.argsStack[methodName] = [args];
        } else {
          this.argsStack[methodName].push(args);
        }
        // returns
        const returns = this.returns[methodName];
        if (returns === '*') {
          return this;
        } else if (!!returns && returns instanceof Function) {
          return returns();
        } else {
          return undefined;
        }
      };
    }
  }

  getArgs(methodName: keyof DefaultMethods) {
    // @ts-ignore
    return this.args[methodName];
  }

  getArgsStack(methodName: keyof DefaultMethods) {
    // @ts-ignore
    return this.argsStack[methodName];
  }

}

export function rewireModule<Module>(
  loader: ModuleLoader<Module>,
  mockedDeps: ModuleMockedDeps = {},
) {
  return new ModuleRewiring<Module>(loader, mockedDeps);
}

class ModuleRewiring<Module> {

  private rewiremock: typeof _rewiremock;
  private loader: ModuleLoader<Module>;
  private mockedDeps: ModuleMockedDeps;

  constructor(
    loader: ModuleLoader<Module>,
    mockedDeps: ModuleMockedDeps,
  ) {
    // rewiremock
    this.rewiremock = _rewiremock;
    this.rewiremock.overrideEntryPoint(module);
    // props
    this.loader = loader;
    this.mockedDeps = mockedDeps;
  }

  getRewiremock() {
    return this.rewiremock;
  }

  getMocks() {
    return this.mockedDeps;
  }

  getMock<Mocked>(path: string) {
    return this.mockedDeps[path] as Mocked;
  }

  async getModule() {
    return this.rewiremock.around(this.loader, mock => {
      for (const path of Object.keys(this.mockedDeps)) {
        const mocked = this.mockedDeps[path];
        if (mocked instanceof Function) {
          mock(() => import(path)).withDefault(mocked);
        } else {
          mock(() => import(path)).with(mocked);
        }
      }
    });
  }

  async rewireService<Service>(
    serviceName: keyof Module,
    mockedDeps: ServiceMockedDeps = {},
    methodStubs: MethodStubs = {},
  ) {
    const rewiredModule = await this.getModule();
    // init instance
    const serviceConstructor = rewiredModule[serviceName] as any;
    const mockedArgs: any[] = [];
    for (const name of Object.keys(mockedDeps)) {
      mockedArgs.push(mockedDeps[name]);
    }
    // @ts-ignore
    const serviceInstance = new serviceConstructor(...mockedArgs);
    // get rewired service
    return new ServiceRewiring<Module, Service>(
      this,
      serviceInstance,
      mockedDeps,
      methodStubs,
    );
  }

}

class ServiceRewiring<Module, Service> {

  private moduleRewiring: ModuleRewiring<Module>;
  private serviceInstance: Service;
  private mockedDeps: ServiceMockedDeps;
  private stubedMethods: StubedMethods = {};

  constructor(
    moduleRewiring: ModuleRewiring<Module>,
    serviceInstance: Service,
    mockedDeps: ServiceMockedDeps,
    methodStubs: MethodStubs,
  ) {
    this.moduleRewiring = moduleRewiring;
    this.serviceInstance = serviceInstance;
    this.mockedDeps = mockedDeps;
    // stubs
    if (!!methodStubs) {
      this.setStubs(methodStubs);
    }
  }

  getModuleRewiring() {
    return this.moduleRewiring;
  }

  getModuleMocks() {
    return this.moduleRewiring.getMocks();
  }

  getModuleMock<Mocked>(path: string) {
    return this.moduleRewiring.getMock<Mocked>(path);
  }

  getInstance() {
    return this.serviceInstance;
  }

  getServiceMocks() {
    return this.mockedDeps;
  }

  getServiceMock<Mocked>(name: string) {
    return this.mockedDeps[name] as Mocked;
  }

  setStubs(stubs: MethodStubs = {}) {
    for (const method of Object.keys(stubs)) {
      const stubed = stubs[method];
      // set stub
      const stub = sinon.stub(this.serviceInstance, method as any);
      if (stubed instanceof Function) {
        this.stubedMethods[method] = stub.callsFake(stubed as any);
      } else {
        this.stubedMethods[method] = stub.returns(stubed);
      } 
    }
    return this as ServiceRewiring<Module, Service>;
  }

  restoreStubs() {
    for (const method of Object.keys(this.stubedMethods)) {
      this.stubedMethods[method].restore();
    }
  }

}
