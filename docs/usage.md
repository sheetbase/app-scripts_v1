## Usage

### Deploy

Deploy code to GAS using @google/clasp.
Must have @google/clasp installed and logged in.

#### Options

- `dir`: GAS code folder.

### Build

Build module or app for GAS deployment.

#### Options

- `--app`: Build an app.
- `--no-transpile`: Do not run tsc.
- `--tsc`: Custom tsc params.
- `--no-bundle`: Do not run rollup.
- `--rollup`: Custom rollup params.
- `--no-minify`: Do not run uglifyjs.
- `--uglifyjs`: Custom uglifyjs params.
- `--copy`: Resources to be copied, comma-seperated.
- `--min`: Use the minified version for deployment.
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