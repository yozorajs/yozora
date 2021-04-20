import createRollupConfig from '@guanghechen/rollup-config'
import path from 'path'

process.env.ROLLUP_SHOULD_SOURCEMAP = false

async function rollupConfig() {
  const { default: manifest } = await import(path.resolve('package.json'))
  const config = [
    createRollupConfig({
      manifest,
      pluginOptions: {
        commonjsOptions: {
          sourceMap: false,
        },
        typescriptOptions: {
          tsconfig: 'tsconfig.src.json',
          tsconfigOverride: {
            compilerOptions: {
              removeComments: false,
              emitDeclarationOnly: true,
            },
          },
        },
      },
    }),
    createRollupConfig({
      manifest,
      pluginOptions: {
        commonjsOptions: {
          sourceMap: false,
        },
        typescriptOptions: {
          tsconfig: 'tsconfig.src.json',
          tsconfigOverride: {
            compilerOptions: {
              declaration: false,
              declarationMap: false,
              declarationDir: null,
              removeComments: true,
            },
          },
        },
      },
    }),
  ]
  return config
}

export default rollupConfig()
