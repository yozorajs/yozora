const fs = require('fs')
const path = require('path')
const semverRegex = require('semver-regex')
const manifest = require('./package.json')


module.exports = function (plop) {
  const cwd = path.resolve(process.cwd())
  const tokenizerPackageNameRegex = /^(?:[^\/]+\/)tokenizer-([\w\-]+)$/
  plop.setGenerator('tokenizer', {
    description: 'create tokenizer template project',
    prompts: [
      {
        type: 'input',
        name: 'packageName',
        message: 'name',
        transform: (text) => text.trim(),
      },
      {
        type: 'input',
        name: 'tokenizerName',
        message: 'tokenizer name',
        default: ({ packageName }) => {
          let m = tokenizerPackageNameRegex.exec(packageName)
          if (m == null) return packageName.replace(/^[^\/]+[\/]/, '')
          return m[1]
        },
        transform: (text) => text.trim(),
        validate: (text) => /^[\w\-]+$/.test(text),
      },
      {
        type: 'list',
        name: 'tokenizerCategory',
        message: 'tokenizer category',
        choices: ['block', 'inline'],
        default: (answers) => {
          if (/block/.test(answers.packageName)) return 'block'
          if (/inline/.test(answers.packageName)) return 'inline'
          return 'block'
        },
      },
      {
        type: 'input',
        name: 'packageAuthor',
        message: 'author',
        default: (answers) => {
          // set category flag
          switch (answers.tokenizerCategory) {
            case 'block':
              answers.isBlockTokenizer = true
              break
            case 'inline':
              answers.isInlineTokenizer = true
              break
          }

          // detect package.json
          const packageJsonPath = path.resolve(cwd, 'package.json')
          if (fs.existsSync(packageJsonPath)) {
            const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8')
            const packageJson = JSON.parse(packageJsonContent)
            if (packageJson.author == null) return undefined
            if (typeof packageJson.author === 'string') return packageJson.author
            if (typeof packageJson.author.name === 'string') return packageJson.author.name
          }
          return undefined
        },
        transform: (text) => text.trim(),
      },
      {
        type: 'input',
        name: 'packageVersion',
        message: 'version',
        default: manifest.version,
        transform: (text) => text.trim(),
        validate: (text) => semverRegex().test(text),
      },
      {
        type: 'input',
        name: 'packageLocation',
        message: ({ packageName }) => 'location of ' + packageName,
        default: (answers) => {
          // detect lerna
          if (fs.existsSync(path.resolve(cwd, 'lerna.json'))) {
            answers.isLernaProject = true
            answers.projectName = answers.packageName.startsWith('@')
              ? /^@([^\/]+)/.exec(answers.packageName)[1]
              : /^([^\-]+)/.exec(answers.packageName)[1]

            // prefer tokenizers/<tokenizerCategory>
            const tokenizerDir = path.resolve(cwd, 'tokenizers')
            if (fs.existsSync(tokenizerDir) && fs.statSync(tokenizerDir).isDirectory()) {
              let prefixDir = 'tokenizers/'
              if (
                fs.existsSync(path.resolve(tokenizerDir, answers.tokenizerCategory))
                && fs.statSync(path.resolve(tokenizerDir, answers.tokenizerCategory)).isDirectory()
              ) {
                prefixDir += answers.tokenizerCategory + '/'
              }
              return prefixDir + answers.packageName.replace(/^[^\/]+[\/]/, '')
            }
            return 'packages/' + answers.packageName.replace(/^[^\/]+[\/]/, '')
          }
          answers.projectName = answers.packageName.replace(/^@/, '').replace('\/', '-')
          return packageName.replace(/^@/, '')
        },
        transform: (text) => text.trim(),
      },
      {
        type: 'confirm',
        name: 'useBlockTokenizerPreMatchPhaseHook',
        message: 'add pre-match hooks',
        default: true,
        when: (answers) => answers.isBlockTokenizer,
      },
      {
        type: 'confirm',
        name: 'useBlockTokenizerMatchPhaseHook',
        message: 'add match hooks',
        default: true,
        when: (answers) => answers.isBlockTokenizer,
      },
      {
        type: 'confirm',
        name: 'useBlockTokenizerPostMatchPhaseHook',
        message: 'add post-match hooks',
        default: false,
        when: (answers) => answers.isBlockTokenizer,
      },
      {
        type: 'confirm',
        name: 'useBlockTokenizerParsePhaseHook',
        message: 'add parse hooks',
        default: true,
        when: (answers) => answers.isBlockTokenizer,
      },
    ],
    actions: function (answers) {
      const resolveSourcePath = (p) => path.normalize(path.resolve(__dirname, 'boilerplate', p))
      const resolveTargetPath = (p) => path.normalize(path.resolve(answers.packageLocation, p))
      const relativePath = path.relative(answers.packageLocation, cwd)
      const { tokenizerCategory } = answers
      answers.tsconfigExtends = answers.isLernaProject
        ? path.join(relativePath, 'tsconfig')
        : './tsconfig.settings'
      answers.tsconfigSrcExtends = answers.isLernaProject
        ? path.join(relativePath, 'tsconfig.settings')
        : './tsconfig.settings'
      answers.nodeModulesPath = path.join(relativePath, 'node_modules')

      switch (tokenizerCategory) {
        case 'block':
          answers.fallbackTokenizerName = 'paragraph'
          break
        case 'inline':
          answers.fallbackTokenizerName = 'text'
          break
      }

      return [
        {
          type: 'add',
          path: resolveTargetPath('.eslintrc.js'),
          templateFile: resolveSourcePath('.eslintrc.js.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('package.json'),
          templateFile: resolveSourcePath('package.json.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('README.md'),
          templateFile: resolveSourcePath('README.md.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('rollup.config.js'),
          templateFile: resolveSourcePath('rollup.config.js.hbs')
        },
        !answers.isLernaProject && {
          type: 'add',
          path: resolveTargetPath('tsconfig.settings.json'),
          templateFile: resolveSourcePath('tsconfig.settings.json.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('tsconfig.json'),
          templateFile: resolveSourcePath('tsconfig.json.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('tsconfig.src.json'),
          templateFile: resolveSourcePath('tsconfig.src.json.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('src/index.ts'),
          templateFile: resolveSourcePath(`${ tokenizerCategory }-tokenizer/src/index.ts.hbs`)
        },
        {
          type: 'add',
          path: resolveTargetPath('src/tokenizer.ts'),
          templateFile: resolveSourcePath(`${ tokenizerCategory }-tokenizer/src/tokenizer.ts.hbs`)
        },
        {
          type: 'add',
          path: resolveTargetPath('src/types.ts'),
          templateFile: resolveSourcePath(`${ tokenizerCategory }-tokenizer/src/types.ts.hbs`)
        },
        {
          type: 'add',
          path: resolveTargetPath('test/answer.ts'),
          templateFile: resolveSourcePath(`${ tokenizerCategory }-tokenizer/test/answer.ts.hbs`)
        },
        {
          type: 'add',
          path: resolveTargetPath('test/suite.test.ts'),
          templateFile: resolveSourcePath(`${ tokenizerCategory }-tokenizer/test/suite.test.ts.hbs`)
        },
        {
          type: "add",
          path: resolveTargetPath('test/cases/basic.input.json'),
          templateFile: resolveSourcePath(`${ tokenizerCategory }-tokenizer/test/cases/basic.input.json.hbs`)
        }
      ].filter(Boolean)
    }
  })
}
