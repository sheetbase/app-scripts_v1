## Reference

### `Build`

Build module or app for GAS deployment.

- `--module`: Build a module.
- `--min`: Use the minified version for deployment.
- `--vendor`: List of files to put into @vendor.js.
- `--not-transpile`: Do not run tsc.
- `--tsc`: Custom tsc params.
- `--not-bundle`: Do not run rollup.
- `--rollup`: Custom rollup params.
- `--not-minify`: Do not run uglifyjs.
- `--uglifyjs`: Custom uglifyjs params.
- `--copy`: Resources to be copied, comma-seperated.
- `--rename`: Rename bundled deployment file.

### `Readme`

Generate README.md.

- `--not-docs`: No docs link.

### `Docs`

Generate the documentation.

- `--not-api`: Do not run typedoc.
- `--typedoc`: Custom typedoc params.

### `Help`

Display help.

### `*`

Any other command is not supported.