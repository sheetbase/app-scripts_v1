## Usage

### Deploy

Deploy code to GAS using @google/clasp.
Must have @google/clasp installed and logged in.

#### Options

- `dir`: GAS code folder.

### Build

Build module or app for GAS deployment.

#### Options

- `--no-transpile`: Do not run tsc.
- `--no-bundle`: Do not run rollup.
- `--tsc`: Custom tsc params.
- `--rollup`: Custom rollup params.
- `--copy`: Resources to be copied, comma-seperated.

### Readme

Generate README.md.

#### Options

- `--no-docs`: No docs link.

### Api

Generate API reference.

#### Options

- `--typedoc`: Custom typedoc params.

### Help

Display help.

### *

Any other command is not supported.