const routingConvertBuilder = require('./sheetbase-routing.convert');

module.exports = (extra) => {
  return (options, templateService, contentService, projectService) => {
    const templateSections = {};
    // consts
    const { convertings = {} } = options;
    const { name: packageName } = projectService.PACKAGE;
    const name = packageName.split('/').pop();
    const umdName = name.charAt(0).toUpperCase() + name.substr(1) + 'Module';
    // routing
    templateSections['routing'] = [
      '*',
      routingConvertBuilder(umdName),
      convertings['routing'] || {}
    ];
    // result
    return templateService.createRendering(templateSections, extra);
  }
}