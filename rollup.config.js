import createRollupConfig from '@guanghechen/rollup-config'
import fs from 'fs-extra'

// Read manifest from `<cwd>/package.json`
const manifest = {}
const packageJson = fs.readJsonSync('package.json')
const fields = [
  'source',
  'main',
  'module',
  'types',
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
]
for (const key of fields) {
  const val = packageJson[key]
  if (val != null) manifest[key] = val
}

const config = createRollupConfig({
  manifest,
  pluginOptions: {
    typescriptOptions: { tsconfig: 'tsconfig.src.json' },
  },
})

export default config
