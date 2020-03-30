const fs = require('fs')
const path = require('path')
const semverRegex = require('semver-regex')
const manifest = require('./package.json')


module.exports = function (plop) {
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
          const packageJsonPath = path.resolve(process.cwd(), 'package.json')
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
        {
          type: 'add',
          path: resolveTargetPath('tsconfig.json'),
          templateFile: answers.isLernaProject
            ? resolveSourcePath('tsconfig.json.hbs')
            : resolveSourcePath('tsconfig.full.json.hbs')
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
      ].filter(Boolean)
    }
  })
}
