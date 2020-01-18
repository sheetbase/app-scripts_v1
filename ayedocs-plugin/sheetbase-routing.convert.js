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
        name: name.replace('?', ''),
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

function buildErrorItems(errors) {
  return Object
    .keys(errors)
    .map(code => [`\`${code}\``, errors[code]])
}

function buildRoutes(
  contentService,
  methodExtractor,
  methods,
  disabledRoutes,
  fileContent,
  childLevel,
) {
  const summary = [];
  const detail = [];
  methods.forEach(method => {
    const { NAME, REFLECTION, SHORT_TEXT, TYPE, PARAMETERS, RETURNS } = method;
    const { routeMethod, routeEndpoint, routeId } = methodExtractor(NAME);
    // check disabled status
    let isDisabled = false;
    if (!!disabledRoutes[routeEndpoint]) {
      const value = disabledRoutes[routeEndpoint];
      isDisabled = typeof value === 'string' || value.indexOf(routeMethod.toLowerCase()) !== -1;
    }
    // summary
    summary.push([
      `[${routeEndpoint}](#${routeId})`,
      `\`${routeMethod}\``,
      isDisabled ? `\`true\`` : '',
      SHORT_TEXT
    ]);
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
      contentService.blockHeading(
        `\`${routeMethod}\` ${routeEndpoint}`,
        childLevel + 2,
        routeId
      ),
      contentService.blockText(`${isDisabled ? `\`DISABLED\``: ''}` + ' ' + SHORT_TEXT),
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
        const buildEndpoint = endpoint => ('/' + endpoint).replace('//', '/');
        const buildEndpointID = (method, endpoint) => method + '_' + endpoint.replace(/\//g, '_');
        const methodExtractor = name => {
          const routeMethod = name.toUpperCase();
          const routeEndpoint = buildEndpoint(endpoint);
          const routeId = buildEndpointID(routeMethod, routeEndpoint);
          return { routeMethod, routeEndpoint, routeId };
        };
        // errors
        try {
          const { DEFAULT_VALUE: errors } = routeDeclaration.getChild('errors');
          errorItems.push(
            ...buildErrorItems(errors),
          );
        } catch (error) {
          // no .errors
        }
        // disabled
        let disabledRoutes = {};
        try {
          const { DEFAULT_VALUE: value } = routeDeclaration.getChild('disabled');
          disabledRoutes = { [endpoint]: value };
        } catch (error) {
          // no .disabled
        }
        // routes
        const { summary, detail } = buildRoutes(
          contentService,
          methodExtractor,
          routeDeclaration.getFunctionsOrMethods(),
          disabledRoutes,
          fileContent,
          childLevel,
        );
        summaryRoutes.push(...summary);
        detailRoutes.push(...detail);
      }
      // a group
      else {
        const buildEndpoint = endpoint => {
          if (
            !baseEndpoint ||
            (
              !!baseEndpoint &&
              (
                endpoint.substr(0, baseEndpoint.length) === baseEndpoint ||
                endpoint.substr(0, baseEndpoint.length + 1) === `/${baseEndpoint}`
              )
            )
          ) {
            endpoint = '/' + endpoint;
          } else {
            endpoint = '/' + baseEndpoint + '/' + endpoint;
          }
          return endpoint.replace('//', '/');
        }
        const buildEndpointID = (method, endpoint) => method + '_' + endpoint.replace(/\//g, '_');
        const methodExtractor = name => {
          const result = name
            .replace('__', ' ')
            .split(' ')
            .map(x => x.replace(/\_/g, '/'));
          const routeMethod = result[0];
          const routeEndpoint = buildEndpoint(result[1]);
          const routeId = buildEndpointID(routeMethod, routeEndpoint);
          return { routeMethod, routeEndpoint, routeId };
        };
        // errors
        try {
          const { DEFAULT_VALUE: errors } = routeDeclaration.getChild('routingErrors');
          errorItems.push(
            ...buildErrorItems(errors)
          );
        } catch (error) {
          // no .routingErrors
        }        
        // disabled
        let disabledRoutes = {};
        try {
          const { DEFAULT_VALUE: disabled } = routeDeclaration.getChild('disabledRoutes');
          Object.keys(disabled).forEach(endpoint => {
            const value = disabled[endpoint];
            disabledRoutes[buildEndpoint(endpoint)] = value;
          });
        } catch (error) {
          // no .disabledRoutes
        }
        // routes
        const { summary, detail } = buildRoutes(
          contentService,
          methodExtractor,
          routeDeclaration.getFunctionsOrMethods(
            methodDeclaration => methodDeclaration.NAME.indexOf('__') !== -1
          ),
          disabledRoutes,
          fileContent,
          childLevel,
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
        `**${umdName}** provides REST API endpoints allowing clients to access server resources. Theses enpoints are not exposed by default, to expose the endpoints:`,
        [
          `\`\`\`ts`,
          `${umdName}.registerRoutes(routeEnabling?);`,
          `\`\`\``
        ].join('\n')
      ]),
    );
    // errors
    if (!!errorItems.length) {
      routingBlocks.push(
        contentService.blockHeading('Errors', childLevel, 'routing-errors'),
        contentService.blockText([
          `**${umdName}** returns these routing errors, you may use the error code to customize the message:`
        ]),
        contentService.blockList(errorItems),
      );
    }
    // routes
    routingBlocks.push(
      contentService.blockHeading('Routes', childLevel, 'routing-routes'),
      contentService.blockHeading('Routes overview', childLevel + 1, 'routing-routes-overview'),
      contentService.blockTable(
        ['Route', 'Method', 'Disabled', 'Description'],
        summaryRoutes,
      ),
      contentService.blockHeading('Routes detail', childLevel + 1, 'routing-routes-detail'),
      ...detailRoutes
    );
    // result
    return routingBlocks;
  }
}
