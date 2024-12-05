import {
  DependencyCategory,
  createRollupConfig,
  dtsPresetConfigBuilder,
  modify,
  tsPresetConfigBuilder,
} from '@guanghechen/rollup-config'
import fs from 'node:fs/promises'
import path from 'node:path'

const builtins = new Set([])
const externals = new Set([])

export default async function rollupConfig() {
  const manifestPath = path.resolve('package.json')
  const manifestRaw = await fs.readFile(manifestPath, 'utf8')
  const manifest = JSON.parse(manifestRaw)
  const config = await createRollupConfig({
    manifest,
    presetConfigBuilders: [
      tsPresetConfigBuilder({
        typescriptOptions: {
          tsconfig: 'tsconfig.lib.json',
        },
        additionalPlugins: [modify()],
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
  return config
}
