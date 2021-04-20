import createRollupConfig from '@guanghechen/rollup-config'
import path from 'path'

async function rollupConfig() {
  const { default: manifest } = await import(path.resolve('package.json'))
  const config = [
    createRollupConfig({
      manifest,
      pluginOptions: {
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
