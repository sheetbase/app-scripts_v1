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