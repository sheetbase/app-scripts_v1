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
- `--no-bundle`: Do not run rollup.
- `--tsc`: Custom tsc params.
- `--rollup`: Custom rollup params.
- `--copy`: Resources to be copied, comma-seperated.

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