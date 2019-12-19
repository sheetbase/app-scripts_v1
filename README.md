<section id="head" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

# @sheetbase/app-scripts

**Scripts for Sheetbase backend modules and apps.**

</section>

<section id="header">

[![Build Status](https://travis-ci.com/sheetbase/app-scripts.svg?branch=master)](https://travis-ci.com/sheetbase/app-scripts) [![Coverage Status](https://coveralls.io/repos/github/sheetbase/app-scripts/badge.svg?branch=master)](https://coveralls.io/github/sheetbase/app-scripts?branch=master) [![NPM](https://img.shields.io/npm/v/@sheetbase/app-scripts.svg)](https://www.npmjs.com/package/@sheetbase/app-scripts) [![License][license_badge]][license_url] [![Support me on Patreon][patreon_badge]][patreon_url] [![PayPal][paypal_donate_badge]][paypal_donate_url] [![Ask me anything][ask_me_badge]][ask_me_url]

[license_badge]: https://img.shields.io/github/license/mashape/apistatus.svg
[license_url]: https://github.com/sheetbase/app-scripts/blob/master/LICENSE
[patreon_badge]: https://lamnhan.github.io/assets/images/badges/patreon.svg
[patreon_url]: https://www.patreon.com/lamnhan
[paypal_donate_badge]: https://lamnhan.github.io/assets/images/badges/paypal_donate.svg
[paypal_donate_url]: https://www.paypal.me/lamnhan
[ask_me_badge]: https://img.shields.io/badge/ask/me-anything-1abc9c.svg
[ask_me_url]: https://m.me/sheetbase

</section>

<section id="tocx" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

- [Install](#install)
  - [Global](#global)
  - [Local](#local)
- [Ayedocs plugin](#ayedocs-plugin)
  - [Sheetbase template](#sheetbase-template)
  - [Sheetbase installation template](#sheetbase-installation-template)
  - [Sheetbase routing template](#sheetbase-routing-template)
- [Command overview](#command-overview)
- [Command reference](#command-reference)
  - [`build`](#command-build)
- [Detail API reference](https://sheetbase.github.io/app-scripts)


</section>

<section id="installation">

## Install

### Global

`$ npm install -g @sheetbase/app-scripts`

Command: `sheetbase-app-scripts`

### Local

`$ npm install --save-dev @sheetbase/app-scripts`

Add these lines to the project `package.json`.

```json
{
  "scripts": {
    "build": "sheetbase-app-scripts build"
  }
}
```

</section>

<section id="ayedocs-plugin">

## Ayedocs plugin

This package provides Ayedocs templates and converts for conviniently document generation for Sheetbase server modules.

### Sheetbase template

Included all sections:

- Installation
- Options
- Main properties & methods
- Routing

```js
const sheetbaseTemplate = require("@sheetbase/app-scripts/ayedocs-plugin/sheetbase.template");

module.exports = {
  fileRender: {
    "sheetbase.md": sheetbaseTemplate(),
    "sheetbase-full.md": sheetbaseTemplate(true)
  }
};
```

### Sheetbase installation template

Common installation & basic usage section.

```js
const sheetbaseInstallationTemplate = require("@sheetbase/app-scripts/ayedocs-plugin/sheetbase-installation.template");

module.exports = {
  fileRender: {
    "sheetbase-installation.md": sheetbaseInstallationTemplate(),
    "sheetbase-installation-full.md": sheetbaseInstallationTemplate(true)
  }
};
```

### Sheetbase routing template

Showing **endpoint**, **default disabled routes**, **routing errors** and **the list of routes**.

```js
const sheetbaseRoutingTemplate = require("@sheetbase/app-scripts/ayedocs-plugin/sheetbase-routing.template");

module.exports = {
  fileRender: {
    "sheetbase-routing.md": sheetbaseRoutingTemplate(),
    "sheetbase-routing-full.md": sheetbaseRoutingTemplate(true)
  }
};
```

</section>

<section id="cli" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

<h2><a name="command-overview"><p>Command overview</p>
</a></h2>

Scripts for Sheetbase backend modules and apps.

- [`sheetbase-app-scripts build --copy [value] --vendor [value]`](#command-build)

<h2><a name="command-reference"><p>Command reference</p>
</a></h2>

<h3><a name="command-build"><p><code>build</code></p>
</a></h3>

Build distribution package.

**Options**

- `--copy [value]`: Copied resources, comma-seperated.
- `--vendor [value]`: Files for @vendor.js, comma-seperated.

</section>

<section id="license" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

## License

**@sheetbase/app-scripts** is released under the [MIT](https://github.com/sheetbase/app-scripts/blob/master/LICENSE) license.

</section>
