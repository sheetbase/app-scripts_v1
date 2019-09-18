import { EOL } from 'os';
import { resolve } from 'path';
import { format } from 'prettier';
const matchAll = require('match-all');

import { readFile } from './project';
import {
  DeclarationReflection,
  ReflectionType,
  DeclarationData,
  SignatureData,
  getDeclaration,
  getInterfaceProps,
  getClassMethods,
  parseSignature,
  parseDeclarationChildren,
} from './typedoc';

export interface RoutingMethodData extends SignatureData {
  routeName: string;
  routeMethod: string;
  routeEndpoint: string;
  query?: DeclarationData[];
  body?: DeclarationData[];
  data?: DeclarationData[];
}

export { EOL };

export const EOL2X = EOL.repeat(2);

export function eol(repeat = 1) {
  return EOL.repeat(repeat);
}

export function stringBetween(
  input: string,
  prefix: string,
  suffix: string,
  includePrefix = true,
  includeSuffix = true
) {
  let prefixIndex = input.indexOf(prefix);
  let suffixIndex = input.indexOf(suffix);
  if (prefixIndex < 0 || suffixIndex < 0 || suffixIndex <= prefixIndex) {
    return '';
  } else {
    if (!includePrefix) {
      prefixIndex = prefixIndex + prefix.length;
    }
    if (includeSuffix) {
      suffixIndex = suffixIndex + suffix.length;
    }
    return input.substring(prefixIndex, suffixIndex);
  }
}

export function escapeMDTableContent(content: string) {
  return content.replace(/\|/g, '\\|');
}

export function formatMDContent(content: string) {
  return format(content, { parser: 'markdown' });
}

export async function getReadmeSections(): Promise<{ [name: string]: string }> {
  const sections: { [name: string]: string } = {};
  const content = await readFile('README.md');
  const sectionNames = matchAll(
    content,
    /\<section\:([a-zA-Z0-9]+)\>/gi
  ).toArray();
  for (const name of sectionNames) {
    sections[name] = stringBetween(
      content,
      `<!-- <section:${name}> -->`,
      `<!-- </section:${name}> -->`
    );
  }
  return sections;
}

export function buildMDSummary(items: DeclarationData[]) {
  const resultArr: string[] = [
    `| Name | Type | Description |`,
    `| --- | --- | --- |`,
  ];
  for (const itemData of items) {
    const {
      name,
      description: rawDesc = '',
      type: rawType = '',
      isOptional,
    } = itemData;
    const description = escapeMDTableContent(rawDesc || '');
    const type = escapeMDTableContent(rawType || '');
    resultArr.push(
      `| ${isOptional ? name : `**${name}**`} | \`${type}\` | ${description} |`
    );
  }
  return formatMDContent(resultArr.join(EOL));
}

export function getOptionsInterfaceMD() {
  const data = getInterfaceProps(resolve('src', 'lib', 'types.ts'), 'Options');
  return buildMDSummary(data);
}

export function getMainClassFullMD() {
  const data = getClassMethods(resolve('src', 'lib', `main.ts`), `MainService`);
  const summary = getMainClassSummaryMD(data);
  const detail = getMainClassDetailMD(data);
  return formatMDContent([summary, '### Methods detail', detail].join(EOL2X));
}

export function getMainClassSummaryMD(data: SignatureData[]) {
  const resultArr: string[] = [
    `| Method | Return type | Description |`,
    `| --- | --- | --- |`,
  ];
  for (const itemData of data) {
    const {
      name,
      description: rawDesc,
      returnType: rawType,
      params = [],
    } = itemData;
    const description = escapeMDTableContent(rawDesc || '');
    const returnType = escapeMDTableContent(rawType || '');
    const paramArr = params.map(item => item.name);
    resultArr.push(
      `| [${name}(${paramArr.join(
        ', '
      )})](#${name}) | \`${returnType}\` | ${description} |`
    );
  }
  return formatMDContent(resultArr.join(EOL));
}

export function getMainClassDetailMD(data: SignatureData[]) {
  const resultArr: string[] = [];
  for (const itemData of data) {
    const {
      name,
      description,
      content,
      returnType,
      returnDesc,
      params = [],
    } = itemData;
    const subResultArr: string[] = [];
    // title
    const paramArr = params.map(item => item.name);
    subResultArr.push(`#### \`${name}(${paramArr.join(', ')})\``);
    // description
    if (!!description) {
      subResultArr.push(description);
    }
    // content
    if (!!content) {
      subResultArr.push(content);
    }
    // params
    if (!!params.length) {
      subResultArr.push(`**Parameters**`);
      subResultArr.push(buildMDSummary(params));
    }
    // returns
    if (!!returnType) {
      subResultArr.push(`**Return**`);
      subResultArr.push(
        `\`${returnType}\`${!returnDesc ? '' : ' - ' + returnDesc}`
      );
    }
    // hr
    subResultArr.push('---');
    // save sub-item
    resultArr.push(subResultArr.join(EOL2X));
  }
  return formatMDContent(resultArr.join(EOL2X));
}

export function getRoutingInfoFullMD(moduleName: string) {
  const routeClass = getDeclaration(
    resolve('src', 'lib', `route.ts`),
    `RouteService`
  );
  const declarations: DeclarationReflection[] = routeClass.children || [];
  // parse class
  let endpointDeclaration: DeclarationReflection | undefined;
  let disabledDeclaration: DeclarationReflection | undefined;
  let errorsDeclaration: DeclarationReflection | undefined;
  const methodsDeclaration: DeclarationReflection[] = [];
  for (let i = 0, l = declarations.length; i < l; i++) {
    const child: DeclarationReflection = declarations[i];
    if (child.name === 'ENDPOINT') {
      endpointDeclaration = child;
    } else if (child.name === 'DISABLED') {
      disabledDeclaration = child;
    } else if (child.name === 'ERRORS') {
      errorsDeclaration = child;
    } else if (
      child.kindString === 'Method' &&
      !!child.signatures && // a method
      !!child.signatures[0].comment // implicit routing method
    ) {
      methodsDeclaration.push(child);
    }
  }
  // not valid
  if (
    !endpointDeclaration ||
    !disabledDeclaration ||
    !errorsDeclaration ||
    !methodsDeclaration.length
  ) {
    throw new Error('Invalid routing service.');
  }
  // proccess data
  const endpoint = (endpointDeclaration.defaultValue || '').replace(
    /(\")/g,
    ''
  );
  const disabled = (disabledDeclaration.children || []).map(item => ({
    endpoint: item.name,
    methods: JSON.parse(
      (item.defaultValue || '').trim().replace(/(\')/g, '"')
    ) as string[],
  }));
  const errors = (errorsDeclaration.children || []).map(item => ({
    code: item.name,
    message: (item.defaultValue || '').replace(/(\")/g, ''),
  }));
  const methods = methodsDeclaration.map(item => {
    const signature = (item.signatures || [])[0];
    const params = signature.parameters || [];
    const signatureName = signature.name;
    // basic
    const signatureData = parseSignature(signature);
    // route
    const routeInfo = signatureName
      .replace('__', ' /')
      .split(' ')
      .map(x => x.replace(/\_/g, '/'));
    const [routeMethod, routeEndpoint] = routeInfo;
    const routeName = routeMethod + ' ' + routeEndpoint;
    // query & body & data
    let query: DeclarationData[] = [];
    let body: DeclarationData[] = [];
    let data: DeclarationData[] = [];
    for (let i = 0, l = params.length; i < l; i++) {
      const { name, type } = params[i];
      const paramDecleration = (type as ReflectionType).declaration;
      if (name === 'query') {
        query = parseDeclarationChildren(paramDecleration);
      } else if (name === 'body') {
        body = parseDeclarationChildren(paramDecleration);
      } else if (name === 'data') {
        data = parseDeclarationChildren(paramDecleration);
      }
    }
    // result
    return {
      ...signatureData,
      routeName,
      routeMethod,
      routeEndpoint,
      query,
      body,
      data,
    };
  });
  // build content
  const resultArr: string[] = [];
  // register
  resultArr.push(
    `**${moduleName}** module provides REST API endpoints allowing clients to access server resources. Theses enpoints are not public by default, to expose the endpoints:`
  );
  resultArr.push(
    `\`\`\`ts` +
      EOL +
      `${moduleName}.registerRoutes(/* options: AddonRoutesOptions */);` +
      EOL +
      `\`\`\``
  );
  resultArr.push(
    `See detail addon routes options at [AddonRoutesOptions](https://sheetbase.github.io/server/interfaces/addonroutesoptions.html).`
  );
  // endpoint
  resultArr.push(`### Endpoint`);
  resultArr.push(
    `The default endpoint: **\`${endpoint}\`**. The endpoint can be changed by passing \`endpoint\` property when [\`registerRoutes\`](#routing).`
  );
  // disabled
  if (!!disabled.length) {
    const disabledArr: string[] = [];
    disabled.forEach(({ endpoint, methods }) =>
      disabledArr.push(`- \`${methods.join('/').toUpperCase()}\` ${endpoint}`)
    );
    resultArr.push('### Disabled');
    resultArr.push(
      `These routes are disabled by default but can be changed by passing \`disabledRoutes\` property when [\`registerRoutes\`](#routing):`
    );
    resultArr.push(disabledArr.join(EOL2X));
  }
  // errors
  if (!!errors.length) {
    const errorsdArr: string[] = [];
    errors.forEach(({ code, message }) =>
      errorsdArr.push(`- \`${code}\`: ${message}`)
    );
    resultArr.push('### Errors');
    resultArr.push(
      `**${moduleName}** module returns these routing errors, you may use the error code to customize the message.`
    );
    resultArr.push(errorsdArr.join(EOL2X));
  }
  // summary
  const summary = getRoutingInfoSummaryMD(methods);
  if (!!summary) {
    resultArr.push('### Routes');
    resultArr.push(summary);
  }
  // detail
  const detail = getRoutingInfoDetailMD(methods);
  if (!!detail) {
    resultArr.push('#### Routes detail');
    resultArr.push(detail);
  }
  return formatMDContent(resultArr.join(EOL2X));
}

export function getRoutingInfoSummaryMD(data: RoutingMethodData[]) {
  const resultArr: string[] = [
    `| Route | Method | Description |`,
    `| --- | --- | --- |`,
  ];
  for (const itemData of data) {
    const { name, routeEndpoint, routeMethod, description: rawDesc } = itemData;
    const description = escapeMDTableContent(rawDesc || '');
    resultArr.push(
      `| [${routeEndpoint}](#${name}) | \`${routeMethod}\` | ${description} |`
    );
  }
  return formatMDContent(resultArr.join(EOL));
}

export function getRoutingInfoDetailMD(data: RoutingMethodData[]) {
  const resultArr: string[] = [];
  for (const itemData of data) {
    const {
      name,
      description,
      content,
      returnType,
      returnDesc,
      routeEndpoint,
      routeMethod,
      query = [],
      body = [],
      data = [],
    } = itemData;
    const subResultArr: string[] = [];
    // title
    subResultArr.push(`##### \`${routeMethod}\` [${routeEndpoint}](#${name})`);
    // description
    if (!!description) {
      subResultArr.push(description);
    }
    // content
    if (!!content) {
      subResultArr.push(content);
    }
    // query
    if (!!query.length) {
      subResultArr.push(`**Request query**`);
      subResultArr.push(buildMDSummary(query));
    }
    // body
    if (!!body.length) {
      subResultArr.push(`**Request body**`);
      subResultArr.push(buildMDSummary(body));
    }
    // data
    if (!!data.length) {
      subResultArr.push(`**Middleware data**`);
      subResultArr.push(buildMDSummary(data));
    }
    // returns
    if (!!returnType) {
      subResultArr.push(`**Response**`);
      subResultArr.push(
        `\`${returnType}\`${!returnDesc ? '' : ' - ' + returnDesc}`
      );
    }
    // hr
    subResultArr.push('---');
    // save sub-item
    resultArr.push(subResultArr.join(EOL2X));
  }
  return formatMDContent(resultArr.join(EOL2X));
}
