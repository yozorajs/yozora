import {
  DependencyCategory,
  createRollupConfig,
  dtsPresetConfigBuilder,
  tsPresetConfigBuilder,
} from '@guanghechen/rollup-config'
import path from 'node:path'

const builtins = new Set([])
const externals = new Set([])

export default async function rollupConfig() {
  const sourcemapFromCLI = process.argv
    .filter(arg => arg.startsWith('--sourcemap='))
    .map(arg => arg.split('=')[1])
  const sourcemap = sourcemapFromCLI.length > 0 ? sourcemapFromCLI[0] === 'true' : false

  const { default: manifest } = await import(path.resolve('package.json'), {
    assert: { type: 'json' },
  })
  const configs = await createRollupConfig({
    manifest,
    env: { sourcemap },
    presetConfigBuilders: [
      tsPresetConfigBuilder({
        typescriptOptions: {
          tsconfig: 'tsconfig.lib.json',
          sourceMap: true,
        },
      }),
      dtsPresetConfigBuilder({
        dtsOptions: {
          respectExternal: true,
          tsconfig: 'tsconfig.lib.json',
        },
      }),
    ],
    classifyDependency: id => {
      if (builtins.has(id)) return DependencyCategory.BUILTIN
      if (externals.has(id)) return DependencyCategory.EXTERNAL
      return DependencyCategory.UNKNOWN
    },
  })
  return configs
}
