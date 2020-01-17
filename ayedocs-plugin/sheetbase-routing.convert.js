const fs = require('fs');

function extractParamChildren(methodName, methodTags, fileContent) {
  const result = {};
  // extract tags
  const tags = {};
  methodTags.forEach(({ text }) => {
    const [ id, desc ] = text
      .split(' - ')
      .map(x => x.trim().replace(/\r\n|\r|\n/g, ''));
    return tags[id] = desc;
  });
  // extract param
  let paramsStr = fileContent.substr(fileContent.indexOf('  ' + methodName + '('));
  paramsStr = paramsStr.substr(0, paramsStr.indexOf(') {'));
  paramsStr = paramsStr.split('res: ').shift();
  paramsStr = paramsStr.replace(/\r\n|\r|\n/g, '');
  const paramExtracter = (paramName) => {
    const paramOpening = paramName + ': {';
    let paramStr = paramsStr.substr(paramsStr.indexOf(paramOpening) + paramOpening.length);
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
  };
  // query
  if (paramsStr.indexOf('query:') !== -1) {
    result['query'] = paramExtracter('query');
  }
  // body
  if (paramsStr.indexOf('body:') !== -1) {
    result['body'] = paramExtracter('body');
  }
  // data
  if (paramsStr.indexOf('data:') !== -1) {
    result['data'] = paramExtracter('data');
  }
  // result
  return result;
}

function buildDisabledRows(disabled, buildEndpoint) {
  return Object
    .keys(disabled)
    .map(endpoint => {
      const value = disabled[endpoint];
      const valueStr = typeof value === 'string'
        ? `\`${value}\``
        : value.map(val => `\`${ val.toUpperCase() }\``).join(', ');
      return [ buildEndpoint(endpoint), valueStr ];
    });
}

function buildErrorItems(errors) {
  return Object
    .keys(errors)
    .map(code => [`\`${code}\``, errors[code]])
}

function buildRoutes(
  contentService,
  methods,
  fileContent,
  childLevel,
  buildEndpoint,
  buildEndpointID,
  methodExtractor
) {
  const summary = [];
  const detail = [];
  methods.forEach(method => {
    const { NAME, REFLECTION, SHORT_TEXT, TYPE, PARAMETERS, RETURNS } = method;
    const { routeMethod, routeEndpoint } = methodExtractor(NAME);
    // summary
    summary.push([ `[${buildEndpoint(routeEndpoint)}](#${buildEndpointID(routeMethod, routeEndpoint)})`, `\`${routeMethod}\``, SHORT_TEXT ]);
    // detail (request rows)
    let requestQueryRows = [];
    let requestBodyRows = [];
    let requestDataRows = [];
    if (!!PARAMETERS[0]) {
      const paramChildren = extractParamChildren(
        NAME,
        REFLECTION.comment.tags || [],
        fileContent
      );
      Object.keys(paramChildren).forEach(key => {
        const rows = paramChildren[key].map(prop => {
          const { name, type, shortText, isOptional } = prop;
          return [ isOptional ? `${name}?`: `**${name}**`, `[[${type}]]`, shortText ];
        });
        if (key === 'query') {
          requestQueryRows = rows;
        } else if (key === 'body') {
          requestBodyRows = rows;
        } else if (key === 'data') {
          requestDataRows = rows;
        }
      });
    }
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
    detail.push(
      contentService.blockHeading(`\`${routeMethod}\` ${buildEndpoint(routeEndpoint)}`, childLevel + 2, buildEndpointID(routeMethod, routeEndpoint)),
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
  return { summary, detail };
}

module.exports = (umdName) => {
  return (declaration, options, contentService) => {
    // process level
    const withHeading = typeof options.heading === 'boolean' ? options.heading: true;
    const headingLevel = (options.level || 2) - (withHeading ? 0 : 1);
    const childLevel = headingLevel + 1;
    // build blocks
    const errorItems = [];
    const disabledRows = [];
    const summaryRoutes = [];
    const detailRoutes = [];
    const children = declaration.getClasses(declaration => declaration.NAME.endsWith('Route'));
    children.forEach(routeDeclaration => {
      const fileContent = fs.readFileSync(
        './src/' + routeDeclaration.FILE_NAME,
        { encoding: 'utf8' },
      );
      // extract endpoint and baseEndpoint
      let endpoint = '';
      try {
        const endpointDeclaration = routeDeclaration.getChild('endpoint');
        endpoint = endpointDeclaration.DEFAULT_VALUE;
      } catch (error) {}
      let baseEndpoint = '';
      try {
        const baseEndpointDeclaration = routeDeclaration.getChild('baseEndpoint');
        baseEndpoint = baseEndpointDeclaration.DEFAULT_VALUE;
      } catch (error) {}
      // a set
      if (!!endpoint) {
        const buildEndpoint = e => e;
        const buildEndpointID = (method, e) =>
          method + '__' + (e.charAt(0) === '/' ? e.substr(1): e).replace(/\//g, '_');
        const methodExtractor = name => ({      
          routeMethod: name.toUpperCase(),
          routeEndpoint: endpoint,
        });
        // disabled
        try {
          const { DEFAULT_VALUE: value } = routeDeclaration.getChild('disabled');
          disabledRows.push(
            ...buildDisabledRows(
              { [endpoint]: value },
              buildEndpoint
            ),
          );
        } catch (error) {
          // no .disabled
        }
        // errors
        try {
          const { DEFAULT_VALUE: errors } = routeDeclaration.getChild('errors');
          errorItems.push(
            ...buildErrorItems(errors),
          );
        } catch (error) {
          // no .errors
        }
        // routes
        const { summary, detail } = buildRoutes(
          contentService,
          routeDeclaration.getFunctionsOrMethods(),
          fileContent,
          childLevel,
          buildEndpoint,
          buildEndpointID,
          methodExtractor
        );
        summaryRoutes.push(...summary);
        detailRoutes.push(...detail);
      }
      // a group
      else {
        const buildEndpoint = e => ('/' + baseEndpoint + '/' + e).replace('//', '/');
        const buildEndpointID = (method, e) =>
          method + '__' + (!!baseEndpoint ? (baseEndpoint + '_'): '') + e.replace(/\//g, '_');
        const methodExtractor = name => {
          const [ routeMethod, routeEndpoint ] = name
          .replace('__', ' ')
          .split(' ')
          .map(x => x.replace(/\_/g, '/'));
          return { routeMethod, routeEndpoint };
        };
        // disabled
        try {
          const { DEFAULT_VALUE: disabled } = routeDeclaration.getChild('disabledRoutes');
          disabledRows.push(
            ...buildDisabledRows(
              disabled,
              buildEndpoint
            ),
          );
        } catch (error) {
          // no .disabledRoutes
        }
        // errors
        try {
          const { DEFAULT_VALUE: errors } = routeDeclaration.getChild('routingErrors');
          errorItems.push(
            ...buildErrorItems(errors)
          );
        } catch (error) {
          // no .routingErrors
        }
        // routes
        const { summary, detail } = buildRoutes(
          contentService,
          routeDeclaration.getFunctionsOrMethods(
            methodDeclaration => methodDeclaration.NAME.indexOf('__') !== -1
          ),
          fileContent,
          childLevel,
          buildEndpoint,
          buildEndpointID,
          methodExtractor
        );
        summaryRoutes.push(...summary);
        detailRoutes.push(...detail);
      }
    });
    // sum-up data
    const routingBlocks = [];
    // heading
    if (withHeading) {
      routingBlocks.push(contentService.blockHeading('Routing', headingLevel, 'routing'));
    }
    // intro
    routingBlocks.push(
      contentService.blockText([
        `**${umdName}** module provides REST API endpoints allowing clients to access server resources. Theses enpoints are not exposed by default, to expose the endpoints:`,
        [
          `\`\`\`ts`,
          `${umdName}.registerRoutes(routeEnabling?);`,
          `\`\`\``
        ].join('\n')
      ]),
    );
    // disabled
    if (!!disabledRows.length) {
      routingBlocks.push(
        contentService.blockHeading('Disabled', childLevel, 'routing-disabled'),
        contentService.blockText([
          `These routes are disabled by default but can be changed by passing \`disabledRoutes\` property when [\`registerRoutes\`](#routing):`
        ]),
        contentService.blockTable(
          ['Enpoint', 'Methods'],
          disabledRows,
        ),
      );
    }
    // errors
    if (!!errorItems.length) {
      routingBlocks.push(
        contentService.blockHeading('Errors', childLevel, 'routing-errors'),
        contentService.blockText([
          `**${umdName}** module returns these routing errors, you may use the error code to customize the message:`
        ]),
        contentService.blockList(errorItems),
      );
    }
    // routes
    routingBlocks.push(
      contentService.blockHeading('Routes', childLevel, 'routing-routes'),
      contentService.blockHeading('Routes overview', childLevel + 1, 'routing-routes-overview'),
      contentService.blockTable(
        ['Route', 'Method', 'Description'],
        summaryRoutes,
      ),
      contentService.blockHeading('Routes detail', childLevel + 1, 'routing-routes-detail'),
      ...detailRoutes
    );
    // result
    return routingBlocks;
  }
}
