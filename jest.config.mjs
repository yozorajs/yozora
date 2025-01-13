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

  console.log('name:', manifest.name)

  return {
    ...baseConfig,
    coveragePathIgnorePatterns: [
      'packages/character/src/util/node-point.ts',
      'packages/parser/src/types.ts',
      'packages/parser-gfm/src/types.ts',
    ],
    coverageThreshold: {
      ...coverageMap[manifest.name],
      global: {
        branches: 90,
        functions: 100,
        lines: 90,
        statements: 90,
        ...coverageMap[manifest.name]?.global,
      },
    },
    extensionsToTreatAsEsm: ['.ts', '.mts'],
  }
}

const coverageMap = {
  '@yozora/ast-util': {
    global: {
      functions: 84,
      lines: 87,
      statements: 87,
    },
  },
  '@yozora/character': {
    global: {
      branches: 89,
      functions: 63,
    },
  },
  '@yozora/invariant': {
    global: {
      branches: 88,
    },
  },
  '@yozora/jest-for-tokenizer': {
    global: {
      branches: 88,
      functions: 80,
      lines: 84,
      statements: 84,
    },
  },
  '@yozora/markup-weaver': {
    global: {
      functions: 95,
    },
  },
  '@yozora/tokenizer-blockquote': {
    global: {
      branches: 89,
    },
  },
  '@yozora/tokenizer-definition': {
    global: {
      branches: 84,
    },
  },
  '@yozora/tokenizer-delete': {
    global: {
      branches: 77,
    },
  },
  '@yozora/tokenizer-ecma-import': {
    global: {
      branches: 68,
    },
  },
  '@yozora/tokenizer-footnote-reference': {
    global: {
      branches: 89,
    },
  },
  '@yozora/tokenizer-html-block': {
    global: {
      branches: 87,
    },
  },
  '@yozora/tokenizer-html-inline': {
    global: {
      branches: 88,
    },
  },
  '@yozora/tokenizer-image': {
    global: {
      branches: 78,
    },
  },
  '@yozora/tokenizer-inline-code': {
    global: {
      branches: 89,
    },
  },
  '@yozora/tokenizer-inline-math': {
    global: {
      branches: 84,
    },
  },
  '@yozora/tokenizer-link': {
    global: {
      branches: 81,
    },
  },
  '@yozora/tokenizer-link-reference': {
    global: {
      branches: 86,
    },
  },
  '@yozora/tokenizer-math': {
    global: {
      branches: 89.4,
    },
  },
  '@yozora/tokenizer-paragraph': {
    global: {
      branches: 88,
    },
  },
  '@yozora/tokenizer-text': {
    global: {
      branches: 87,
      functions: 85,
      lines: 87,
      statements: 87,
    },
  },
}
