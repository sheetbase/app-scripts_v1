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