import type { IDesensitizer } from '@guanghechen/helper-jest'
import {
  composeStringDesensitizers,
  createConsoleMock,
  createFilepathDesensitizer,
  createJsonDesensitizer,
  createPackageVersionDesensitizer,
  fileSnapshot,
} from '@guanghechen/helper-jest'
import { runPlopWithMock } from '@guanghechen/helper-plop'
import { toKebabCase } from '@guanghechen/helper-string'
import fs from 'fs-extra'
import path from 'node:path'
import url from 'node:url'
import manifest from '../package.json' assert { type: 'json' }

interface ITestOptions {
  expectedPackageLocation: string
  defaultAnswers: Record<string, unknown>
  mockInputs: string[]
  plopBypass: string[]
  tokenizerName: string
  shouldGenerateFiles: boolean
}

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const outputDir = path.join(__dirname, 'output')
const initialCwd = process.cwd()

beforeEach(async function () {
  if (!fs.existsSync(outputDir)) fs.mkdirpSync(outputDir)
  process.chdir(outputDir)
})

afterEach(async function () {
  fs.removeSync(outputDir)
  process.chdir(initialCwd)
})

const desensitizers = {
  filepath: createFilepathDesensitizer(__dirname),
  packageVersion: createPackageVersionDesensitizer(
    packageVersion => {
      // eslint-disable-next-line jest/no-standalone-expect
      expect(packageVersion).toEqual(manifest.version)
      return '<LATEST>'
    },
    packageName =>
      /^(@yozora\/[^\s\\/]*|packageVersion|toolPackageVersion|version)$/.test(packageName),
  ),
}
const jsonDesensitizer = createJsonDesensitizer({
  string: composeStringDesensitizers(desensitizers.filepath, desensitizers.packageVersion),
})

describe('new-tokenizer', function () {
  const templateConfig = path.join(__dirname, '../index.mjs')

  describe('monorepo', function () {
    beforeAll(() => {
      process.env.DEBUG_IS_MONOREPO = 'true'
    })

    afterAll(() => {
      process.env.DEBUG_IS_MONOREPO = undefined
    })

    async function runTest(options: ITestOptions): Promise<void> {
      const consoleMock = createConsoleMock(
        ['log', 'debug'],
        jsonDesensitizer as IDesensitizer<unknown[]>,
      )
      await runPlopWithMock(
        templateConfig,
        options.plopBypass,
        options.mockInputs,
        options.defaultAnswers,
      )
      expect(consoleMock.getIndiscriminateAll()).toMatchSnapshot('console')

      if (options.shouldGenerateFiles) {
        const targetDir = path.resolve(options.expectedPackageLocation)
        fileSnapshot(
          targetDir,
          [
            '__test__/answer.ts',
            `__test__/${toKebabCase(options.tokenizerName)}.spec.ts`,
            `__test__/fixtures/basic.json`,
            'src/index.ts',
            'src/match.ts',
            'src/parse.ts',
            'src/tokenizer.ts',
            'src/types.ts',
            'tsconfig.json',
            'tsconfig.src.json',
          ],
          desensitizers.filepath,
        )

        fileSnapshot(
          targetDir,
          ['package.json', 'README.md'],
          composeStringDesensitizers(desensitizers.filepath, desensitizers.packageVersion),
        )
      }
    }

    test('block', async function () {
      await runTest({
        expectedPackageLocation: 'tokenizers/waw',
        defaultAnswers: {
          isDebugMode: true,
        },
        mockInputs: ['', '', 'some descriptions', 'tokenizers/waw', '', '', ''],
        plopBypass: ['@yozora/tokenizer-waw', 'waw', 'block'],
        shouldGenerateFiles: true,
        tokenizerName: 'waw',
      })
    })

    test('inline', async function () {
      await runTest({
        expectedPackageLocation: 'tokenizers/inline-waw',
        defaultAnswers: {
          isDebugMode: true,
        },
        mockInputs: ['', '', 'some descriptions', 'tokenizers/inline-waw'],
        plopBypass: ['@yozora/tokenizer-inline-waw', 'inlineWaw', 'inline'],
        shouldGenerateFiles: true,
        tokenizerName: 'inlineWaw',
      })
    })

    test('default', async function () {
      await runTest({
        expectedPackageLocation: 'packages/tokenizer-inline-waw',
        defaultAnswers: {
          isDebugMode: true,
          debugOptions: {
            shouldGenerateFiles: false,
          },
        },
        mockInputs: ['', '', '', '', '', ''],
        plopBypass: ['@yozora/tokenizer-inline-waw'],
        shouldGenerateFiles: false,
        tokenizerName: 'inlineWaw',
      })
    })
  })

  describe('not a monorepo', function () {
    beforeAll(() => {
      process.env.DEBUG_IS_MONOREPO = 'false'
    })

    afterAll(() => {
      process.env.DEBUG_IS_MONOREPO = undefined
    })

    async function runTest(options: ITestOptions): Promise<void> {
      const consoleMock = createConsoleMock(
        ['log', 'debug'],
        jsonDesensitizer as IDesensitizer<unknown[]>,
      )
      await runPlopWithMock(
        templateConfig,
        options.plopBypass,
        options.mockInputs,
        options.defaultAnswers,
      )
      expect(consoleMock.getIndiscriminateAll()).toMatchSnapshot('console')

      if (options.shouldGenerateFiles) {
        const targetDir = path.resolve(options.expectedPackageLocation)
        fileSnapshot(
          targetDir,
          [
            '__test__/answer.ts',
            `__test__/${toKebabCase(options.tokenizerName)}.spec.ts`,
            `__test__/fixtures/basic.json`,
            'src/index.ts',
            'src/match.ts',
            'src/parse.ts',
            'src/tokenizer.ts',
            'src/types.ts',
            '.editorconfig',
            '.eslintrc',
            '.gitignore',
            '.prettierrc',
            'jest.config.js',
            'tsconfig.json',
            'tsconfig.settings.json',
            'tsconfig.src.json',
          ],
          desensitizers.filepath,
        )

        fileSnapshot(
          targetDir,
          ['package.json', 'README.md'],
          composeStringDesensitizers(desensitizers.filepath, desensitizers.packageVersion),
        )
      }
    }

    test('block', async function () {
      await runTest({
        expectedPackageLocation: 'tokenizers/waw',
        defaultAnswers: {
          isDebugMode: true,
        },
        mockInputs: ['', '', 'some descriptions', 'tokenizers/waw', '', '', ''],
        plopBypass: ['@yozora/tokenizer-waw', 'waw', 'block'],
        shouldGenerateFiles: true,
        tokenizerName: 'waw',
      })
    })

    test('inline', async function () {
      await runTest({
        expectedPackageLocation: 'tokenizers/inline-waw',
        defaultAnswers: {
          isDebugMode: true,
        },
        mockInputs: ['', '', 'some descriptions', 'tokenizers/inline-waw'],
        plopBypass: ['@yozora/tokenizer-inline-waw', 'inlineWaw', 'inline'],
        shouldGenerateFiles: true,
        tokenizerName: 'inlineWaw',
      })
    })

    test('default', async function () {
      await runTest({
        expectedPackageLocation: 'packages/tokenizer-inline-waw',
        defaultAnswers: {
          isDebugMode: true,
          debugOptions: {
            shouldGenerateFiles: false,
          },
        },
        mockInputs: ['', '', '', '', '', ''],
        plopBypass: ['@yozora/tokenizer-inline-waw'],
        shouldGenerateFiles: false,
        tokenizerName: 'inlineWaw',
      })
    })
  })
})
