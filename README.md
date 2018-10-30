# sheetbase-app-scripts

Scripts for Sheetbase backend modules and apps.

<!-- <block:header> -->

[![Build Status](https://travis-ci.com/Sheetbase/app-scripts.svg?branch=master)](https://travis-ci.com/Sheetbase/app-scripts) [![Coverage Status](https://coveralls.io/repos/github/Sheetbase/app-scripts/badge.svg?branch=master)](https://coveralls.io/github/Sheetbase/app-scripts?branch=master) [![NPM](https://img.shields.io/npm/v/@sheetbase/app-scripts.svg)](https://www.npmjs.com/package/@sheetbase/app-scripts) [![License][license_badge]][license_url] [![Support me on Patreon][patreon_badge]][patreon_url] [![PayPal][paypal_donate_badge]][paypal_donate_url] [![Ask me anything][ask_me_badge]][ask_me_url]

<!-- </block:header> -->

## Install

``$ npm install --save-dev @sheetbase/app-scripts``

Add these lines to the project *package.json*.

```json
{
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

Build module or app for GAS deployment.

#### Options

- `exportName`: Module name.
- `--param`: Module params, comma-seperated.
- `--app`: Build an app, else a module.
- `--vendor`: Build a vendor module.
- `--bundle`: Merge dependencies with the module.
- `--polyfill`: Include polyfill.
- `--no-init`: Not init the default instance of the module.
- `--copy`: Files or folders will be copied, comma-seperated.

### Push

Push module or app to GAS using @google/clasp.

### Readme

Generate README.md.

#### Options

- `exportName`: Module name.
- `--no-docs`: No docs link.

### Help

Display help.

### *

Any other command is not supported.

## How?

:ambulance: TODO: still a mess, needed improvements.

### Build a module

Script: `sheetbase-app-scripts build [--bundle]`

Sample module: https://github.com/sheetbase/module-utils-server

Build the module for distribution to GAS and NPM.

- Get export name, for example: **Foo**.
- Generate description comment block from info provided by package.json **(0)**.
- Read src/index.ts (if exists) **(1)**.
- Read src/example.ts (if exists) **(2)**.
- Read src/global.ts (if exists) **(3)**.
- Read all file in src/ excepts *types/*, *index.ts*, *example.ts*, *global.ts* **(4)**.
- Concat all **(4)** content to form main code **(5)**.
- Build module code **(6)**.

	```ts
	export function FooModule(/** params if exist */) { 
		// (5)
		// (1)
		return moduleExports || {};
	}
	```
- Build NPM output (deploy to NPM) **(7)**.

	```ts
	// (0)
	// (6)

	// if omit --no-init, then:
	// add 'Foo' to the global namespace
	((process) => {
		process['Foo'] = FooModule(/** params if exist */);
	})(this);

	// (3)
	```
- Build GAS output (deploy as a library) **(8)**.

	```ts
	// (6)

	// if omit --no-init, then:
	// add exports to the global namespace
	((process) => {
		const Foo = FooModule(/** params if exist */);
		for (const prop of Object.keys({... Foo, ... Object.getPrototypeOf(Foo)})) {
			process[prop] = Foo[prop];
		}
	})(this);

	// (3)
	```

- Compile **(7)** and save to *sheetbase.module.js*.
- Compile **(8)** and save to *dist/<export_name>.js*.
- Compile **(0)** + **(2)** and save to *dist/@index.js*.
- Copy .clasp.json and appsscript.json to *dist/*.
- Copy dependencies to *dist/@modules/* or bundled to *dist/@modules.js*.

### Build a module (vendor)

Script: `sheetbase-app-scripts build --vendor [--bundle]`

Sample module: https://github.com/sheetbase/module-md5-server

Like build a module, but:

- Vendor code lives in .js file. And included in output as is.
- Usually build README with the *--no-docs* flag.

### Build an app

Script: `sheetbase-app-scripts build --app [--bundle --no-polyfill]`

Like build a module, but:

- Without wrapped code inside `...Module()` function.
- Without saving sheetbase.module.js file.
- May add *polyfill* module.

### Build README file

Script: `sheetbase-app-scripts readme [--no-docs]`

Generate the README.md file.

- Get export name.
- Read blocks (see [blocks](#blocks)).
- Read *name*, *description*, *git url* (*docs url*), *homepage*, *license* from package.json.
- Read *scriptId* from .clasp.json.
- Read Google scopes *oauthScopes* from appsscript.json.
- Read examples from src/example.ts.
- Get API overview from src/types/.

#### Blocks

##### Header

Will be included after description section.

- Started with: `<!-- block:header -->`

- Ended with: `<!-- /block:header -->`

##### Center

Will be included after install section.

- Started with: `<!-- block:center -->`

- Ended with: `<!-- /block:center -->`

##### Footer

Will be included at the bottom.

- Started with: `<!-- block:footer -->`

- Ended with: `<!-- /block:footer -->`

### Push to GAS

Script: `sheetbase-app-scripts push`

Push content inside *dist/* folder using [@google/clasp](https://github.com/google/clasp).

### Build docs

Sample script: `typedoc ./src --out ./docs --mode file --target ES6 --excludeExternals --excludeNotExported --ignoreCompilerErrors`

Generate docs/ folder using [Typedoc](https://github.com/TypeStrong/typedoc).

## Project structure

### **dist/**

Generated using app-scripts.

Distribution folder to be deployed to Google Apps Script. Always run '*clasp push*' in this folder.

### **docs/** (optional)

Manualy documentation or generated using [Typedoc](https://github.com/TypeStrong/typedoc).

### **src/**

Project main code.

#### **src/types/** (optional)

Put all type-related code in this folder and will be ignored when build code.

#### **src/index.ts** (optional)

Module export logic, must have a name of **moduleExports**.

```ts
export const moduleExports = MyAwesomeModuleExports;
```

#### **src/global.ts** (optional)

Code will be included at the top level of output code when build.

#### **src/example.ts** (optional)

Usage examples, will be included in README.md and dist/@index.js.

```ts
export function example1() {}
export function example2() {}
// ...
export function exampleN() {}
```

#### **src/\*\*/\*.ts** (optional)

Any other *.ts* file will be wrapped inside **<module_export_name>Module()** function.

```ts
function MyAwesomeModule() {

	/** Class 1 */
	/** Class 2 */
	// ...
	/** Class N */

	/** moduleExports */
	return moduleExports || {};
}
```

#### **src/\*.js** (optional)

Usually a vendor module code. Sample file: https://github.com/Sheetbase/module-md5-server/blob/master/src/md5.min.js

### **.clasp.json**

[@google/clasp](https://github.com/google/clasp) config file, will be copied to *dist/* folder.

### **.claspignore**

[@google/clasp](https://github.com/google/clasp) ignore file, prevent accidentially push the root folder, only run push '*clasp push*' inside the *dist/* folder.

### **appsscript.json**

GAS meta file, will be copied to *dist/* folder.

### **index.ts**

Module exports for developing against Typescript.

### **sheetbase.module.js**

Module compiled code for using with npm, generated when build code without *--app* flag (build a module).

## License

@sheetbase/app-scripts is released under the [MIT][license_url] license.

<!-- <block:footer> -->

[license_badge]: https://img.shields.io/github/license/mashape/apistatus.svg
[license_url]: https://github.com/sheetbase/app-scripts/blob/master/LICENSE

[patreon_badge]: https://ionicabizau.github.io/badges/patreon.svg
[patreon_url]: https://www.patreon.com/lamnhan

[paypal_donate_badge]: https://ionicabizau.github.io/badges/paypal_donate.svg
[paypal_donate_url]: https://www.paypal.me/lamnhan

[ask_me_badge]: https://img.shields.io/badge/ask/me-anything-1abc9c.svg
[ask_me_url]: https://m.me/sheetbase

<!-- </block:footer> -->