import createRollupConfig from '@guanghechen/rollup-config'
import manifest from './package.json'

const config = createRollupConfig({
  manifest,
  pluginOptions: {
    typescriptOptions: {
      tsconfig: 'tsconfig.src.json',
    },
  },
})

export default config
