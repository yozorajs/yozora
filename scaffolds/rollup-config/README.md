[![npm version](https://img.shields.io/npm/v/@yozora/rollup-config.svg)](https://www.npmjs.com/package/@yozora/rollup-config)
[![npm download](https://img.shields.io/npm/dm/@yozora/rollup-config.svg)](https://www.npmjs.com/package/@yozora/rollup-config)
[![npm license](https://img.shields.io/npm/l/@yozora/rollup-config.svg)](https://www.npmjs.com/package/@yozora/rollup-config)


# Usage

## Install
```shell
yarn add --dev @yozora/rollup-config
```

## Options

* `manifest`

   property  | type      | required  | description
  :---------:|:---------:|:---------:|:------------------------
   `source`  | `string`  | `true`    | source entry file
   `main`    | `string`  | `false`   | target entry file of cjs
   `module`  | `string`  | `false`   | target entry file of es


* pluginOptions
   property                   | type      | required  | description
  :--------------------------:|:---------:|:---------:|:------------------------
   `eslintOption`             | `object`  | `false`   | options for [rollup-plugin-eslint][]
   `nodeResolveOptions`       | `object`  | `false`   | options for [@rollup/plugin-node-resolve][]
   `typescriptOptions`        | `object`  | `false`   | options for [rollup-plugin-typescript2][]
   `commonjsOptions`          | `object`  | `false`   | options for [@rollup/plugin-commonjs][]
   `peerDepsExternalOptions`  | `object`  | `false`   | options for [rollup-plugin-peer-deps-external][]


[rollup-plugin-eslint]: https://github.com/TrySound/rollup-plugin-eslint#readme
[@rollup/plugin-node-resolve]: https://github.com/rollup/plugins/tree/master/packages/node-resolve#readme
[rollup-plugin-typescript2]: https://github.com/ezolenko/rollup-plugin-typescript2#readme
[@rollup/plugin-commonjs]: https://github.com/rollup/plugins/tree/master/packages/commonjs#readme
[rollup-plugin-peer-deps-external]: https://github.com/pmowrer/rollup-plugin-peer-deps-external#readme
