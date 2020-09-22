const routingTemplate = require('./sheetbase-routing.template');
const installationTemplate = require('./sheetbase-installation.template');

module.exports = (extra) => {
  return (options, templateService, contentService, projectService) => {
    const templateSections = {};
    // consts
    const { convertings = {} } = options;
    // getting started
    const installationRendering = installationTemplate(false)
      (options, templateService, contentService, projectService);
    templateSections['installation'] = installationRendering['installation'];
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
    const routingRendering = routingTemplate(false)
      (options, templateService, contentService, projectService);
    templateSections['routing'] = routingRendering['routing'];
    // result
    return templateService.createRendering(templateSections, extra);
  }
}