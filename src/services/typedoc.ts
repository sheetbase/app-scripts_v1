import {
  Application as Typedoc,
  Reflection,
  DeclarationReflection,
  SignatureReflection,
  ParameterReflection,
} from 'typedoc';
import {
  Type,
  ArrayType,
  IntrinsicType,
  IntersectionType,
  ReferenceType,
  ReflectionType,
  StringLiteralType,
  TupleType,
  TypeOperatorType,
  TypeParameterType,
  UnionType,
  UnknownType,
} from 'typedoc/dist/lib/models';

export {
  Reflection,
  DeclarationReflection,
  SignatureReflection,
  ParameterReflection,
  Type,
  ArrayType,
  IntrinsicType,
  IntersectionType,
  ReferenceType,
  ReflectionType,
  StringLiteralType,
  TupleType,
  TypeOperatorType,
  TypeParameterType,
  UnionType,
  UnknownType,
};

export interface ReflectionData {
  name?: string;
  description?: string;
  content?: string;
}
export interface DeclarationData extends ReflectionData {
  type?: string;
  isOptional?: boolean;
}
export interface ParameterData extends DeclarationData {}
export interface SignatureData extends ReflectionData {
  returnType?: string;
  returnDesc?: string;
  params?: ParameterData[];
}

export class TypedocService {
  constructor() {}

  getApp(configs = {}) {
    return new Typedoc({
      // default
      mode: 'file',
      logger: 'none',
      target: 'ES5',
      module: 'CommonJS',
      experimentalDecorators: true,
      ignoreCompilerErrors: true,
      // custom
      ...configs,
    });
  }

  generateDocs(src: string[], out: string) {
    const app = this.getApp({
      excludeNotExported: true,
      excludePrivate: true,
      excludeProtected: true,
      readme: 'none',
    });
    const project = app.convert(app.expandInputFiles(src));
    return !project ? null : app.generateDocs(project, out);
  }

  getProject(path: string) {
    // typedoc app
    const app = this.getApp();
    // convert
    const project = app.convert([path]);
    if (!project) {
      throw new Error('Typedoc convert failed.');
    }
    // result
    return project;
  }

  getDeclaration(filePath: string, declarationName: string) {
    const project = this.getProject(filePath);
    // extract declaration
    let declaration;
    for (const child of project.children || []) {
      if (child.name === declarationName) {
        declaration = child;
        break;
      }
    }
    // error
    if (!declaration) {
      throw new Error('No declaration found.');
    }
    // result
    return declaration;
  }

  getInterfaceProps(filePath: string, interfaceName: string) {
    const interfaceDeclaration = this.getDeclaration(filePath, interfaceName);
    return this.parseDeclarationChildren(interfaceDeclaration);
  }

  getClassMethods(filePath: string, className: string) {
    const classDeclaration = this.getDeclaration(filePath, className);
    // parsing
    const methods: SignatureData[] = [];
    for (const method of classDeclaration.children || []) {
      if (method.kindString === 'Method' && method.flags.isExported) {
        const [signature] = method.signatures || [];
        const item: SignatureData = this.parseSignature(signature);
        methods.push(item);
      }
    }
    return methods;
  }

  parseReflection(reflection: Reflection) {
    const name = reflection.name;
    const description = ((reflection.comment || {}).shortText || '').replace(
      /(?:\r\n|\r|\n)/g,
      ' '
    );
    const content = (reflection.comment || {}).text || '';
    return { name, description, content } as ReflectionData;
  }

  parseDeclaration(declaration: DeclarationReflection) {
    const { name, description, content } = this.parseReflection(declaration);
    const type = (declaration.type as Type).toString();
    const isOptional =
      declaration.flags.isOptional || !!declaration.defaultValue;
    // result
    return { name, description, content, isOptional, type } as DeclarationData;
  }

  parseDeclarationChildren(declaration: DeclarationReflection) {
    const props: DeclarationData[] = [];
    for (const prop of declaration.children || []) {
      const item: DeclarationData = this.parseDeclaration(prop);
      props.push(item);
    }
    return props;
  }

  parseParameter(parameter: ParameterReflection) {
    return this.parseDeclaration(
      parameter as DeclarationReflection
    ) as ParameterData;
  }

  parseSignature(signature: SignatureReflection) {
    const { name, description, content } = this.parseReflection(signature);
    const returnType = (signature.type as Type).toString();
    const returnDesc = (signature.comment || {}).returns || '';
    const params: DeclarationData[] = [];
    for (const param of signature.parameters || []) {
      const item = this.parseParameter(param);
      params.push(item);
    }
    return {
      name,
      description,
      content,
      params,
      returnType,
      returnDesc,
    } as SignatureData;
  }
}
