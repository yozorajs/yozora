/* eslint-disable import/no-extraneous-dependencies */
import { tsMonorepoConfig } from '@guanghechen/jest-config'
import { createRequire } from 'node:module'
import path from 'node:path'
import url from 'node:url'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default async function () {
  const baseConfig = await tsMonorepoConfig(__dirname, {
    useESM: true,
    tsconfigFilepath: path.join(__dirname, 'tsconfig.test.esm.json'),
  })

  return {
    ...baseConfig,
    coveragePathIgnorePatterns: [
      'packages/character/src/util/node-point.ts',
      'packages/parser/src/types.ts',
      'packages/parser-gfm/src/types.ts',
      /tokenizers[/\\][^/]*[/\\]src[/\\]index\.ts/.source,
    ],
    coverageProvider: 'babel',
    coverageThreshold: {
      global: {
        branches: 50,
        functions: 65,
        lines: 60,
        statements: 60,
      },
    },
    extensionsToTreatAsEsm: ['.ts', '.mts'],
    prettierPath: require.resolve('prettier-2'),
  }
}
