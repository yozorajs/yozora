import { createRollupConfig } from '@barusu/rollup-config'
import path from 'path'
import manifest from './package.json'

const resolvePath = p => path.resolve(__dirname, p)
const paths = {
  tsconfig: resolvePath('tsconfig.src.json'),
}

const config = createRollupConfig({
  manifest,
  pluginOptions: {
    typescriptOptions: {
      tsconfig: paths.tsconfig,
    },
  },
})

export default config
