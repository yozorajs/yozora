import createRollupConfig from '@guanghechen/rollup-config'
import fs from 'fs-extra'

// Read manifest from `<cwd>/package.json`
const manifest = {}
const packageJson = fs.readJsonSync('package.json')
for (const key of ['source', 'main', 'module', 'types']) {
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
