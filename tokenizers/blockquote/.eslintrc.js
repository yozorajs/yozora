module.exports = {
  root: true,
  extends: [
    '@yozora/eslint-config'
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json'
  },
  rules: {

  }
}
