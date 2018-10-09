# sheetbase-app-scripts

Scripts for Sheetbase modules and apps.

[![License][license_badge]][license_url] [![Support me on Patreon][patreon_badge]][patreon_url] [![PayPal][paypal_donate_badge]][paypal_donate_url] [![Ask me anything][ask_me_badge]][ask_me_url]

## Install

``$ npm install --save-dev @sheetbase/app-scripts``

Add these lines to the project *package.json*.

```json
{
	"exportName": "MyModule", // optional
	"scripts": {
		"build:code": "sheetbase-app-scripts build",
		"build:readme": "sheetbase-app-scripts readme",
		"build": "npm run build:code && npm run build:readme",
		"push": "sheetbase-app-scripts push"
	}
}
```

## Usage

### Build

Build module of app for GAS deployment.

#### Options

- `exportName`: Optional export name or use the folder name.
- `--app`: Build an app, else a module.
- `--vendor`: A vendor module.
- `--bundle`: Merge dependencies with the module.

#### Examples

- `sheetbase-app-scripts build` (build a module).
- `sheetbase-app-scripts build --app` (build a backend app).
- `sheetbase-app-scripts build --vendor` (build a module that ported from an package).
- `sheetbase-app-scripts build --bundle` (build a module and add bundle all dependencies to the output file).

### Push

Push module of app to GAS using @google/clasp.

#### Examples

- `sheetbase-app-scripts push` (push content in 'dist' folder).

### Readme

Generate README.md.

#### Options

- `exportName`: Optional export name or use the folder name.
- `--no-docs`: No docs link.

#### Examples

- `sheetbase-app-scripts readme` (update the readme file).

### Help

Displays the help.

## How?

TODO

## Project structure

TODO

## License

[MIT][license_url]

[license_badge]: https://img.shields.io/github/license/mashape/apistatus.svg
[license_url]: https://github.com/sheetbase/app-scripts/blob/master/LICENSE

[patreon_badge]: https://ionicabizau.github.io/badges/patreon.svg
[patreon_url]: https://www.patreon.com/lamnhan

[paypal_donate_badge]: https://ionicabizau.github.io/badges/paypal_donate.svg
[paypal_donate_url]: https://www.paypal.me/lamnhan

[ask_me_badge]: https://img.shields.io/badge/ask/me-anything-1abc9c.svg
[ask_me_url]: https://m.me/sheetbase