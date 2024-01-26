import { convertToBoolean } from '@guanghechen/helper-option'
import {
  createNpmPackagePrompts,
  resolveNpmPackageAnswers,
  resolveNpmPackagePreAnswers,
} from '@guanghechen/helper-plop'
import { toKebabCase, toTrim } from '@guanghechen/helper-string'
import path from 'node:path'
import url from 'node:url'
import manifest from './package.json'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const transformers = {
  tokenizerName: toTrim,
}

export default async function (plop) {
  const preAnswers = await resolveNpmPackagePreAnswers({
    isMonorepo: convertToBoolean(process.env.DEBUG_IS_MONOREPO),
  })
  const { cwd, isMonorepo } = preAnswers
  const tokenizerPackageNameRegex = /^(?:[^\\/]+\/)tokenizer-([\w-]+)$/

  const defaultAnswers = { packageVersion: manifest.version }
  const prompts = await createNpmPackagePrompts(preAnswers, defaultAnswers)
  prompts.splice(
    1,
    0,
    {
      type: 'input',
      name: 'tokenizerName',
      message: 'tokenizer name',
      default: ({ packageName }) => {
        let m = tokenizerPackageNameRegex.exec(packageName)
        if (m == null) return packageName.replace(/^[^\\/]+[\\/]/, '')
        return m[1]
      },
      transformer: transformers.tokenizerName,
      validate: text => /^[\w-]+|@[\w-]+\/[\w-]+$/.test(text),
    },
    {
      type: 'list',
      name: 'tokenizerCategory',
      message: 'tokenizer category',
      choices: ['block', 'inline'],
      default: answers => {
        if (/block/.test(answers.packageName)) return 'block'
        if (/inline/.test(answers.packageName)) return 'inline'
        return 'block'
      },
    },
  )

  plop.setGenerator('tokenizer', {
    description: 'create tokenizer template project',
    prompts: [...prompts],
    actions: function (_answers) {
      const answers = resolveNpmPackageAnswers(preAnswers, _answers)
      answers.tokenizerName = transformers.tokenizerName(_answers.tokenizerName)
      answers.tokenizerCategory = _answers.tokenizerCategory

      switch (answers.tokenizerCategory) {
        case 'block':
          answers.isBlockTokenizer = true
          answers.fallbackTokenizerName = 'paragraph'
          break
        case 'inline':
          answers.isInlineTokenizer = true
          answers.fallbackTokenizerName = 'text'
          break
      }

      const resolveSourcePath = p => path.normalize(path.resolve(__dirname, 'boilerplate', p))
      const resolveTargetPath = p => path.normalize(path.resolve(answers.packageLocation, p))
      const relativePath = path.relative(answers.packageLocation, cwd)

      const { tokenizerName, tokenizerCategory } = answers
      answers.tsconfigExtends = answers.isMonorepo
        ? path.join(relativePath, 'tsconfig')
        : './tsconfig.settings'
      answers.tsconfigSrcExtends = answers.isMonorepo
        ? path.join(relativePath, 'tsconfig.settings')
        : './tsconfig.settings'
      answers.nodeModulesPath = path.join(relativePath, 'node_modules')
      answers.toolPackageVersion = manifest.version

      // Assign resolved data into plop templates.
      Object.assign(_answers, answers)

      if (_answers.isDebugMode) {
        console.debug('answers:', answers)
        const debugOptions = _answers.debugOptions || {}
        if (debugOptions.shouldGenerateFiles === false) return []
      }

      return [
        !isMonorepo && {
          type: 'add',
          path: resolveTargetPath('.eslintrc'),
          templateFile: resolveSourcePath('.eslintrc.hbs'),
        },
        !isMonorepo && {
          type: 'add',
          path: resolveTargetPath('rollup.config.mjs'),
          templateFile: resolveSourcePath('rollup.config.mjs.hbs'),
        },
        !isMonorepo && {
          type: 'add',
          path: resolveTargetPath('.editorconfig'),
          templateFile: resolveSourcePath('.editorconfig.hbs'),
        },
        !isMonorepo && {
          type: 'add',
          path: resolveTargetPath('.gitignore'),
          templateFile: resolveSourcePath('.gitignore.hbs'),
        },
        !isMonorepo && {
          type: 'add',
          path: resolveTargetPath('.prettierrc'),
          templateFile: resolveSourcePath('.prettierrc.hbs'),
        },
        !isMonorepo && {
          type: 'add',
          path: resolveTargetPath('jest.config.js'),
          templateFile: resolveSourcePath('jest.config.js.hbs'),
        },
        !isMonorepo && {
          type: 'add',
          path: resolveTargetPath('tsconfig.settings.json'),
          templateFile: resolveSourcePath('tsconfig.settings.json.hbs'),
        },
        {
          type: 'add',
          path: resolveTargetPath('package.json'),
          templateFile: resolveSourcePath('package.json.hbs'),
        },
        {
          type: 'add',
          path: resolveTargetPath('README.md'),
          templateFile: resolveSourcePath('README.md.hbs'),
        },
        {
          type: 'add',
          path: resolveTargetPath('tsconfig.json'),
          templateFile: resolveSourcePath('tsconfig.json.hbs'),
        },
        {
          type: 'add',
          path: resolveTargetPath('tsconfig.src.json'),
          templateFile: resolveSourcePath('tsconfig.src.json.hbs'),
        },
        {
          type: 'add',
          path: resolveTargetPath('src/index.ts'),
          templateFile: resolveSourcePath(`${tokenizerCategory}-tokenizer/src/index.ts.hbs`),
        },
        {
          type: 'add',
          path: resolveTargetPath('src/match.ts'),
          templateFile: resolveSourcePath(`${tokenizerCategory}-tokenizer/src/match.ts.hbs`),
        },
        {
          type: 'add',
          path: resolveTargetPath('src/parse.ts'),
          templateFile: resolveSourcePath(`${tokenizerCategory}-tokenizer/src/parse.ts.hbs`),
        },
        {
          type: 'add',
          path: resolveTargetPath('src/tokenizer.ts'),
          templateFile: resolveSourcePath(`${tokenizerCategory}-tokenizer/src/tokenizer.ts.hbs`),
        },
        {
          type: 'add',
          path: resolveTargetPath('src/types.ts'),
          templateFile: resolveSourcePath(`${tokenizerCategory}-tokenizer/src/types.ts.hbs`),
        },
        {
          type: 'add',
          path: resolveTargetPath('__test__/answer.ts'),
          templateFile: resolveSourcePath(`${tokenizerCategory}-tokenizer/__test__/answer.ts.hbs`),
        },
        {
          type: 'add',
          path: resolveTargetPath(`__test__/${toKebabCase(tokenizerName)}.spec.ts`),
          templateFile: resolveSourcePath(
            `${tokenizerCategory}-tokenizer/__test__/suite.spec.ts.hbs`,
          ),
        },
        {
          type: 'add',
          path: resolveTargetPath('__test__/fixtures/basic.json'),
          templateFile: resolveSourcePath(
            `${tokenizerCategory}-tokenizer/__test__/fixtures/basic.json.hbs`,
          ),
        },
      ].filter(Boolean)
    },
  })
}
