# sheetbase-app-scripts

Scripts for Sheetbase backend modules and apps.

<!-- <block:header> -->

[![Build Status](https://travis-ci.com/sheetbase/app-scripts.svg?branch=master)](https://travis-ci.com/sheetbase/app-scripts) [![Coverage Status](https://coveralls.io/repos/github/sheetbase/app-scripts/badge.svg?branch=master)](https://coveralls.io/github/sheetbase/app-scripts?branch=master) [![NPM](https://img.shields.io/npm/v/@sheetbase/app-scripts.svg)](https://www.npmjs.com/package/@sheetbase/app-scripts) [![License][license_badge]][license_url] [![Support me on Patreon][patreon_badge]][patreon_url] [![PayPal][paypal_donate_badge]][paypal_donate_url] [![Ask me anything][ask_me_badge]][ask_me_url]

<!-- </block:header> -->

## Install

### Global

`$ npm install -g @sheetbase/app-scripts`

Command: `sheetbase-app-scripts`

### Local

`$ npm install --save-dev @sheetbase/app-scripts`

Add these lines to the project *package.json*.

```json
{
   "scripts": {
      "build": "sheetbase-app-scripts build",
      "readme": "sheetbase-app-scripts readme",
      "docs": "sheetbase-app-scripts docs",
      "deploy": "sheetbase-app-scripts deploy"
   }
}
```

## Usage

### Deploy

Deploy code to GAS using @google/clasp.
Must have @google/clasp installed and logged in.

#### Options

- `dir`: GAS code folder.
- `--version`: Also saving a new version.

### Build

Build module or app for GAS deployment.

#### Options

- `--app`: Build an app.
- `--min`: Use the minified version for deployment.
- `--vendor`: List of files to put into @vendor.js.
- `--no-transpile`: Do not run tsc.
- `--tsc`: Custom tsc params.
- `--no-bundle`: Do not run rollup.
- `--rollup`: Custom rollup params.
- `--no-minify`: Do not run uglifyjs.
- `--uglifyjs`: Custom uglifyjs params.
- `--copy`: Resources to be copied, comma-seperated.
- `--rename`: Rename bundled deployment file.

### Readme

Generate README.md.

#### Options

- `--no-docs`: No docs link.

### Docs

Generate the documentation.

#### Options

- `--no-api`: Do not run typedoc.
- `--typedoc`: Custom typedoc params.

### Help

Display help.

### *

Any other command is not supported.

## License

@sheetbase/app-scripts is released under the [MIT][license_url] license.

<!-- <block:footer> -->

[license_badge]: https://img.shields.io/github/license/mashape/apistatus.svg
[license_url]: https://github.com/sheetbase/app-scripts/blob/master/LICENSE

[patreon_badge]: https://lamnhan.github.io/assets/images/badges/patreon.svg
[patreon_url]: https://www.patreon.com/lamnhan

[paypal_donate_badge]: https://lamnhan.github.io/assets/images/badges/paypal_donate.svg
[paypal_donate_url]: https://www.paypal.me/lamnhan

[ask_me_badge]: https://img.shields.io/badge/ask/me-anything-1abc9c.svg
[ask_me_url]: https://m.me/sheetbase

<!-- </block:footer> -->