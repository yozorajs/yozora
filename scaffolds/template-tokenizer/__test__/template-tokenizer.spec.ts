import type { Desensitizer } from '@guanghechen/jest-helper'
import {
  composeStringDesensitizers,
  createConsoleMock,
  createFilepathDesensitizer,
  createJsonDesensitizer,
  createPackageVersionDesensitizer,
  fileSnapshot,
} from '@guanghechen/jest-helper'
import { toKebabCase } from '@guanghechen/option-helper'
import { runPlopWithMock } from '@guanghechen/plop-helper'
import fs from 'fs-extra'
import path from 'path'
import manifest from '../package.json'

const initialCwd = process.cwd()
const outputDir = path.join(__dirname, 'output')

beforeEach(async function () {
  jest.setTimeout(10000)
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
    (packageName, packageVersion) => {
      if (/^(@yozora\/|version$)/.test(packageName)) {
        // eslint-disable-next-line jest/no-standalone-expect
        expect(packageVersion).toEqual(manifest.version)
        return '<LATEST>'
      }
      return packageVersion
    },
  ),
}
const jsonDesensitizer = createJsonDesensitizer({
  string: desensitizers.filepath,
})

describe('new-tokenizer', function () {
  const templateConfig = path.join(__dirname, '../index.js')

  interface TestOptions {
    expectedPackageLocation: string
    defaultAnswers: Record<string, unknown>
    mockInputs: string[]
    plopBypass: string[]
    tokenizerName: string
    shouldGenerateFiles: boolean
  }

  async function runTest(options: TestOptions): Promise<void> {
    const consoleMock = createConsoleMock(
      ['log', 'debug'],
      jsonDesensitizer as Desensitizer<unknown[]>,
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
          'src/tokenizer.ts',
          'src/types.ts',
          'rollup.config.js',
          'tsconfig.json',
          'tsconfig.src.json',
        ],
        desensitizers.filepath,
      )

      fileSnapshot(
        targetDir,
        ['package.json', 'README.md'],
        composeStringDesensitizers(
          desensitizers.filepath,
          desensitizers.packageVersion,
        ),
      )
    }
  }

  test('block', async function () {
    await runTest({
      expectedPackageLocation: 'tokenizers/waw',
      defaultAnswers: {
        useTokenizerMatchBlockHook: true,
        useTokenizerPostMatchBlockHook: true,
        useTokenizerParseBlockHook: true,
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
        useTokenizerMatchBlockHook: true,
        useTokenizerPostMatchBlockHook: true,
        useTokenizerParseBlockHook: true,
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
        useTokenizerMatchBlockHook: true,
        useTokenizerPostMatchBlockHook: true,
        useTokenizerParseBlockHook: true,
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