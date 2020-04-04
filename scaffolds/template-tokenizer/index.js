const fs = require('fs')
const path = require('path')
const semverRegex = require('semver-regex')
const manifest = require('./package.json')


module.exports = function (plop) {
  const cwd = path.resolve(process.cwd())
  const tokenizerPackageNameRegex = /^(?:[^\/]+\/)tokenizer-([\w\-]+)$/
  plop.setGenerator('inline-tokenizer', {
    description: 'create inline-tokenizer template project',
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
        type: 'input',
        name: 'packageAuthor',
        message: 'author',
        default: (answers) => {
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
          if (fs.existsSync(path.resolve(process.cwd(), 'lerna.json'))) {
            answers.isLernaProject = true
            answers.projectName = answers.packageName.startsWith('@')
              ? /^@([^\/]+)/.exec(answers.packageName)[1]
              : /^([^\-]+)/.exec(answers.packageName)[1]

            // prefer tokenizers/
            const tokenizerDir = path.resolve(process.cwd(), 'tokenizers')
            if (fs.existsSync(tokenizerDir) && fs.statSync(tokenizerDir).isDirectory()) {
              return 'tokenizers/' + answers.packageName.replace(/^[^\/]+[\/]/, '')
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
        name: 'override__initializeEatingState',
        message: 'override initializeEatingState',
        default: false,
      },
    ],
    actions: function (answers) {
      const resolveSourcePath = (p) => path.normalize(path.resolve(__dirname, 'boilerplate', p))
      const resolveTargetPath = (p) => path.normalize(path.resolve(answers.packageLocation, p))
      const relativePath = path.relative(answers.packageLocation, cwd)
      answers.tsconfigExtends = answers.isLernaProject
        ? path.join(relativePath, 'tsconfig')
        : './tsconfig.settings'
      answers.tsconfigSrcExtends = answers.isLernaProject
        ? path.join(relativePath, 'tsconfig.settings')
        : './tsconfig.settings'
      answers.nodeModulesPath = path.join(relativePath, 'node_modules')

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
          templateFile: resolveSourcePath('inline-tokenizer/src/index.ts.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('src/tokenizer.ts'),
          templateFile: resolveSourcePath('inline-tokenizer/src/tokenizer.ts.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('src/types.ts'),
          templateFile: resolveSourcePath('inline-tokenizer/src/types.ts.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('test/answer.ts'),
          templateFile: resolveSourcePath('inline-tokenizer/test/answer.ts.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('test/suite.test.ts'),
          templateFile: resolveSourcePath('inline-tokenizer/test/suite.test.ts.hbs')
        },
        {
          type: "add",
          path: resolveTargetPath('test/cases/basic.input.json'),
          templateFile: resolveSourcePath('inline-tokenizer/test/cases/basic.input.json.hbs')
        }
      ].filter(Boolean)
    }
  })
}
