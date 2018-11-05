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