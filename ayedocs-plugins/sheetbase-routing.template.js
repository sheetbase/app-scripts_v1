const routingConvertBuilder = require('./sheetbase-routing.convert');

module.exports = (extra) => {
  return (options, templateService, contentService, projectService) => {
    const templateSections = {};
    // consts
    const { convertings = {} } = options;
    const { name: packageName } = projectService.PACKAGE;
    const name = packageName
      .split('/')
      .pop()
      .split('-')
      .map((x, i) => i === 0 ? x: (x.charAt(0).toUpperCase() + x.substr(1)))
      .join('');
    const iifeName = (name.charAt(0).toUpperCase() + name.substr(1) + 'Module');
    // routing
    templateSections['routing'] = [
      '*',
      routingConvertBuilder(iifeName),
      convertings['routing'] || {}
    ];
    // result
    return templateService.createRendering(templateSections, extra);
  }
}