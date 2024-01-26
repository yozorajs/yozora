/* eslint-disable import/no-extraneous-dependencies */
import { tsMonorepoConfig } from '@guanghechen/jest-config'
import path from 'node:path'
import url from 'node:url'

export default async function () {
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
  const { default: manifest } = await import(path.resolve('package.json'), {
    assert: { type: 'json' },
  })
  const baseConfig = await tsMonorepoConfig(__dirname, {
    useESM: true,
    tsconfigFilepath: path.join(__dirname, 'tsconfig.test.json'),
  })

  return {
    ...baseConfig,
    coveragePathIgnorePatterns: [
      'packages/character/src/util/node-point.ts',
      'packages/parser/src/types.ts',
      'packages/parser-gfm/src/types.ts',
      /tokenizers[/\\][^/]*[/\\]src[/\\]index\.ts/.source,
    ],
    coverageThreshold: {
      global: {
        branches: 50,
        functions: 65,
        lines: 60,
        statements: 60,
      },
      ...coverageMap[manifest.name],
    },
    extensionsToTreatAsEsm: ['.ts', '.mts'],
  }
}

const coverageMap = {}
