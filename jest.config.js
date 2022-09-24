const { tsMonorepoConfig } = require('@guanghechen/jest-config')

module.exports = {
  ...tsMonorepoConfig(__dirname),
  testRegex: '/(__test__)/[\\s\\S]+\\.spec\\.[jt]sx?$',
  coveragePathIgnorePatterns: [
    /packages[/\\]character[/\\]src[/\\]util[/\\]node-point\.ts/.source,
    /packages[/\\]parser[/\\]src[/\\]types\.ts/.source,
    /packages[/\\]parser-gfm[/\\]src[/\\]types\.ts/.source,
    /tokenizers[/\\][^/]*[/\\]src[/\\]index\.ts/.source,
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 75,
      lines: 60,
      statements: 60,
    },
  },
}
