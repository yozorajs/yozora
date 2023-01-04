import createRollupConfig from '@guanghechen/rollup-config'
import path from 'path'

export default async function rollupConfig() {
  const { default: manifest } = await import(
    path.resolve('package.json'),
    { assert: { type: 'json' } },
  )
  const config = await createRollupConfig({
    manifest,
    pluginOptions: {
      typescriptOptions: { tsconfig: 'tsconfig.src.json' },
    },
  })
  return config
}
