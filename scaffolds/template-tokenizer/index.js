const { toKebabCase, toTrim } = require('@guanghechen/option-helper')
const {
  createNpmPackagePrompts,
  resolveNpmPackageAnswers,
  resolveNpmPackagePreAnswers,
} = require('@guanghechen/plop-helper')
const path = require('path')
const manifest = require('./package.json')

const transformers = {
  tokenizerName: toTrim,
}

module.exports = function (plop) {
  const preAnswers = resolveNpmPackagePreAnswers()
  const defaultAnswers = { packageVersion: manifest.version }
  const { cwd, isMonorepo } = preAnswers
  const tokenizerPackageNameRegex = /^(?:[^\\/]+\/)tokenizer-([\w-]+)$/

  const prompts = createNpmPackagePrompts(preAnswers, defaultAnswers)
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
    prompts: [
      ...prompts,
      {
        type: 'confirm',
        name: 'useTokenizerMatchBlockHook',
        message: 'add match hooks',
        default: true,
        when: answers => answers.tokenizerCategory === 'block',
      },
      {
        type: 'confirm',
        name: 'useTokenizerPostMatchBlockHook',
        message: 'add post-match hooks',
        default: false,
        when: answers => answers.tokenizerCategory === 'block',
      },
      {
        type: 'confirm',
        name: 'useTokenizerParseBlockHook',
        message: 'add parse hooks',
        default: true,
        when: answers => answers.tokenizerCategory === 'block',
      },
    ],
    actions: function (_answers) {
      const answers = resolveNpmPackageAnswers(preAnswers, _answers)
      answers.tokenizerName = transformers.tokenizerName(_answers.tokenizerName)
      answers.tokenizerCategory = _answers.tokenizerCategory
      answers.useTokenizerMatchBlockHook = _answers.useTokenizerMatchBlockHook
      answers.useTokenizerPostMatchBlockHook =
        _answers.useTokenizerPostMatchBlockHook
      answers.useTokenizerParseBlockHook = _answers.useTokenizerParseBlockHook

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

      const resolveSourcePath = p =>
        path.normalize(path.resolve(__dirname, 'boilerplate', p))
      const resolveTargetPath = p =>
        path.normalize(path.resolve(answers.packageLocation, p))
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

      /**
       * Determine whether should append a comma.
       */
      answers.usingHooks = false
      const hookNames = [
        'TokenizerMatchBlockHook',
        'TokenizerPostMatchBlockHook',
        'TokenizerParseBlockHook',
        'BlockTokenizerPostParsePhaseHook',
      ]
      for (let i = 0; i < hookNames.length; ++i) {
        const hookName = hookNames[i]
        answers[hookName + '__isNotLastHook'] = false
        if (answers['use' + hookName]) {
          answers.usingHooks = true
          for (let j = i - 1; j >= 0; --j) {
            const previousHookName = hookNames[j]
            answers[previousHookName + '__isNotLastHook'] = true
          }
        }
      }

      if (answers.useTokenizerMatchBlockHook) {
        answers.lastHook = 'TokenizerMatchBlockHook'
      }
      if (answers.useTokenizerPostMatchBlockHook) {
        answers.lastHook = 'TokenizerPostMatchBlockHook'
      }
      if (answers.useTokenizerParseBlockHook) {
        answers.lastHook = 'TokenizerParseBlockHook'
      }

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
          path: resolveTargetPath('rollup.config.js'),
          templateFile: resolveSourcePath('rollup.config.js.hbs'),
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
          templateFile: resolveSourcePath(
            `${tokenizerCategory}-tokenizer/src/index.ts.hbs`,
          ),
        },
        {
          type: 'add',
          path: resolveTargetPath('src/tokenizer.ts'),
          templateFile: resolveSourcePath(
            `${tokenizerCategory}-tokenizer/src/tokenizer.ts.hbs`,
          ),
        },
        {
          type: 'add',
          path: resolveTargetPath('src/types.ts'),
          templateFile: resolveSourcePath(
            `${tokenizerCategory}-tokenizer/src/types.ts.hbs`,
          ),
        },
        {
          type: 'add',
          path: resolveTargetPath('__test__/answer.ts'),
          templateFile: resolveSourcePath(
            `${tokenizerCategory}-tokenizer/__test__/answer.ts.hbs`,
          ),
        },
        {
          type: 'add',
          path: resolveTargetPath(
            `__test__/${toKebabCase(tokenizerName)}.spec.ts`,
          ),
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
