const fs = require('fs');

function extractParamChildren(methodName, methodTags, fileContent, paramName) {
  // extract tags
  const tags = {};
  methodTags.forEach(({ text }) => {
    const [ id, desc ] = text
      .split(' - ')
      .map(x => x.trim().replace(/\r\n|\r|\n/g, ''));
    return tags[id] = desc;
  });
  // get param str
  let paramStr = fileContent.substr(fileContent.indexOf('  ' + methodName + '('));
  paramStr = paramStr.substr(0, paramStr.indexOf(') {'));
  paramStr = paramStr.replace(/\r\n|\r|\n/g, '');
  const paramOpening = paramName + ': {';
  paramStr = paramStr.substr(paramStr.indexOf(paramOpening) + paramOpening.length);
  paramStr = paramStr.substr(0, paramStr.indexOf('}'));
  // result
  return paramStr
  .split(';')
  .map(x => x.trim())
  .filter(x => !!x)
  .map(item => {
    const [ name, type ] = item.split(':').map(x => x.trim());
    const shortText = tags[paramName + '.' + name];
    const isOptional = item.indexOf('?:') !== -1;
    return {
      name,
      type,
      shortText,
      isOptional,
    };
  });
}

function routingConvertBuilder(umdName) {
  return (declaration, options, contentService) => {
    const routingBlocks = [];
    // const
    const fileContent = fs.readFileSync(
      './src/' + declaration.FILE_NAME, { encoding: 'utf8' });
    // intro
    routingBlocks.push(
      contentService.blockHeading('Routing', 2, 'routing'),
      contentService.blockText([
        `**${umdName}** module provides REST API endpoints allowing clients to access server resources. Theses enpoints are not public by default, to expose the endpoints:`,
        [
          `\`\`\`ts`,
          `${umdName}.registerRoutes(/* routing options */);`,
          `\`\`\``
        ].join('\n'),
        `See detail addon routes options at [AddonRoutesOptions](https://sheetbase.github.io/server/interfaces/addonroutesoptions.html).`
      ]),
    );
    // endpoint
    try {
      const baseEndpointDeclaration = declaration.getChild('baseEndpoint');
      const endpoint = baseEndpointDeclaration.DEFAULT_VALUE;
      routingBlocks.push(
        contentService.blockHeading('Endpoint', 3, 'routing-endpoint'),
        contentService.blockText([
          `The default endpoint: **\`${endpoint}\`**. The endpoint can be changed by passing \`endpoint\` property when [\`registerRoutes\`](#routing).`
        ]),
      );
    } catch (error) {
      // no .baseEndpoint
    }
    // disabled
    try {
      const disabledRoutesDeclaration = declaration.getChild('disabledRoutes');
      const disabled = disabledRoutesDeclaration.DEFAULT_VALUE;
      const tableRows = Object.keys(disabled).map(endpoint => {
        const value = disabled[endpoint];
        const valueStr = typeof value === 'string'
          ? `\`${value}\``
          : value.map(val => `\`${ val.toUpperCase() }\``).join(', ');
        return [endpoint, valueStr];
      });
      routingBlocks.push(
        contentService.blockHeading('Disabled', 3, 'routing-disabled'),
        contentService.blockText([
          `These routes are disabled by default but can be changed by passing \`disabledRoutes\` property when [\`registerRoutes\`](#routing):`
        ]),
        contentService.blockTable(
          ['Enpoint', 'Methods'],
          tableRows,
        ),
      );
    } catch (error) {
      // no .disabledRoutes
    }
    // errors
    try {
      const routingErrorsDeclaration = declaration.getChild('routingErrors');
      const errors = routingErrorsDeclaration.DEFAULT_VALUE;
      const listItems = Object.keys(errors).map(code => [`\`${code}\``, errors[code]]);
      routingBlocks.push(
        contentService.blockHeading('Errors', 3, 'routing-errors'),
        contentService.blockText([
          `**${umdName}** module returns these routing errors, you may use the error code to customize the message:`
        ]),
        contentService.blockList(listItems),
      );
    } catch (error) {
      // no .routingErrors
    }
    // routes
    const summaryRoutes = [];
    const detailRoutes = [];
    declaration
    .getFunctionsOrMethods(dec => dec.NAME.indexOf('__') !== -1)
    .forEach(method => {
      const { NAME, REFLECTION, SHORT_TEXT, TYPE, PARAMETERS, RETURNS } = method;
      const [ routeMethod, routeEndpoint ] = NAME
        .replace('__', ' /')
        .split(' ')
        .map(x => x.replace(/\_/g, '/'));
      // summary
      summaryRoutes.push([ `[${routeEndpoint}](#${NAME})`, `\`${routeMethod}\``, SHORT_TEXT ]);
      // detail (request rows)
      let requestQueryRows = [];
      let requestBodyRows = [];
      let requestDataRows = [];
      PARAMETERS.forEach(param => {
        const paramChildren = extractParamChildren(
          NAME,
          REFLECTION.comment.tags || [],
          fileContent,
          param.name
        );
        const rows = paramChildren.map(prop => {
          const { name, type, shortText, isOptional } = prop;
          return [ isOptional ? `${name}?`: `**${name}**`, `[[${type}]]`, shortText ];
        });
        if (param.name === 'query') {
          requestQueryRows = rows;
        } else if (param.name === 'body') {
          requestBodyRows = rows;
        } else if (param.name === 'data') {
          requestDataRows = rows;
        }
      });
      // request blocks
      const requestHeaders = ['Name', 'Type', 'Description'];
      const requestQuery = [];
      const requestBody = [];
      const requestData = [];
      if (!!requestQueryRows.length) {
        requestQuery.push(
          contentService.blockText('**Request query**'),
          contentService.blockTable(requestHeaders, requestQueryRows),
        );
      }
      if (!!requestBodyRows.length) {
        requestQuery.push(
          contentService.blockText('**Request body**'),
          contentService.blockTable(requestHeaders, requestBodyRows),
        );
      }
      if (!!requestDataRows.length) {
        requestQuery.push(
          contentService.blockText('**Middleware data**'),
          contentService.blockTable(requestHeaders, requestDataRows),
        );
      }
      // save detail
      detailRoutes.push(
        contentService.blockHeading(`\`${routeMethod}\` ${routeEndpoint}`, 5, NAME),
        contentService.blockText(SHORT_TEXT),
        ...requestQuery,
        ...requestBody,
        ...requestData,
        contentService.blockText([
          '**Response**',
          `\`${TYPE}\`` + (!!RETURNS ? ` - ${RETURNS}` : '')
        ]),
        contentService.blockText('---'),
      );
    });
    // result
    routingBlocks.push(
      contentService.blockHeading('Routes', 3, 'routing-routes'),
      contentService.blockHeading('Routes overview', 4, 'routing-routes-overview'),
      contentService.blockTable(
        ['Route', 'Method', 'Description'],
        summaryRoutes,
      ),
      contentService.blockHeading('Routes detail', 4, 'routing-routes-detail'),
      ...detailRoutes
    );
    return routingBlocks;
  }
}

module.exports = (full) => {
  return (options, contentService, projectService) => {
    const templateSections = {};
    // consts
    const { convertings = {} } = options;
    const { name: packageName } = projectService.PACKAGE;
    const name = packageName.split('/').pop();
    const umdName = name.charAt(0).toUpperCase() + name.substr(1);
    // header
    if (full) {
      templateSections['head'] = true;
      templateSections['tocx'] = true;
    }
    // getting started
    templateSections['gettingstarted'] = [
      contentService.blockHeading('Getting started', 2, 'getting-started'),
      contentService.blockText([
        `- Install: \`npm install --save ${packageName}\``,
        `- Usage:`,
        [
          `\`\`\`ts`,
          `// 1. import constructor`,
          `import { ${name} } from '${packageName}';`,
          '',
          `// 2. create an instance`,
          `const ${umdName} = ${name}(/* options */);`,
          '',
          `// 3. start using`,
          `const getOptions = ${umdName}.getOptions();`,
          `\`\`\``,
        ].join('\n')
      ]),
    ];
    // options
    templateSections['options'] = [
      contentService.blockHeading('Options', 2, 'options'),
      [
        'Options',
        'SUMMARY_PROPERTIES',
        convertings['options'] || {}
      ]
    ];
    // main
    templateSections['main'] = [
      'Main',
      'FULL',
      {
        ...(convertings['main'] || {}),
        title: 'Main'
      }
    ];
    // routing
    templateSections['routing'] = [
      'RouteService',
      routingConvertBuilder(umdName),
      convertings['routing'] || {}
    ];
    // footer
    if (full) {
      templateSections['license'] = true;
    }
    // result
    return templateSections;
  }
}