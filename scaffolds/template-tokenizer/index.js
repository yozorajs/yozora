const path = require('path')
const semverRegex = require('semver-regex')
const manifest = require('./package.json')


module.exports = function (plop) {
  const tokenizerNameRegex = /^[\w\-]+$/
  plop.setGenerator('inline-tokenizer', {
    description: 'create inline-tokenizer template project',
    prompts: [
      {
        type: 'input',
        name: 'tokenizerName',
        message: 'tokenizer name',
        transform: (text) => text.trim(),
        validate: (text) => tokenizerNameRegex.test(text),
      },
      {
        type: 'input',
        name: 'packageName',
        message: 'package name',
        default: ({ tokenizerName }) => `@yozora/tokenizer-${ tokenizerName }`,
        transform: (text) => text.trim(),
      },
      {
        type: 'input',
        name: 'packageVersion',
        default: manifest.version,
        message: ({ packageName }) => 'version of ' + packageName,
        transform: (text) => text.trim(),
        validate: (text) => semverRegex().test(text),
      },
      {
        type: 'input',
        name: 'packageLocation',
        default: ({ packageName }) => {
          if (packageName.indexOf('/') < 0) return '.'
          return packageName.replace(/[\s\S]*\/([^\/]+)/, 'tokenizers/$1')
        },
        message: ({ packageName }) => 'location of ' + packageName,
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

      if (answers.packageName.startsWith('@yozora/')) {
        answers.yozoraFlag = true
      }

      return [
        {
          type: 'add',
          path: resolveTargetPath('.eslintrc.js'),
          templateFile: resolveSourcePath('tokenizer/.eslintrc.js.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('package.json'),
          templateFile: resolveSourcePath('tokenizer/package.json.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('README.md'),
          templateFile: resolveSourcePath('tokenizer/README.md.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('rollup.config.js'),
          templateFile: resolveSourcePath('tokenizer/rollup.config.js.hbs')
        },
        {
          type: 'add',
          path: resolveTargetPath('tsconfig.json'),
          templateFile: answers.yozoraFlag
            ? resolveSourcePath('tokenizer/tsconfig.json.hbs')
            : resolveSourcePath('tokenizer/tsconfig.full.json.hbs')
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
