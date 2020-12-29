const path = require('path')
const { compilerOptions } = require('./tsconfig')


const moduleNameMapper = {}
for (const moduleName of Object.getOwnPropertyNames(compilerOptions.paths)) {
  const paths = compilerOptions.paths[moduleName]
    .map(p => path.resolve(__dirname, p))
  let pattern = '^' + moduleName.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&') + '$'
  moduleNameMapper[pattern] = paths.length === 1 ? paths[0] : paths
}


module.exports = {
  bail: true,
  verbose: true,
  errorOnDeprecated: true,
  roots: [
    '<rootDir>/src',
    '<rootDir>/__test__',
  ],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  moduleNameMapper,
  globals: {
    'ts-jest': {
      'tsconfig': '<rootDir>/tsconfig.json'
    }
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '/(__test__)/[^/]+\\.spec\\.tsx?$',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/lib/',
    '/dist/',
    '/build/',
    '/target/',
    '/vendor/',
    '/release/',
    '/example/',
    '/demo/',
    '/doc/',
    '/tmp/',
    '/__tmp__/',
    '/script/'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/src/**/*.{js,jsx,ts,tsx}',
    '**/src/*.{js,jsx,ts,tsx}',
    '!**/src/cli.ts',
    '!**/src/command/_util.ts',
    '!**/test/cases/**',
    '!**/__test__/cases/**',
    '!**/node_modules/**',
    '!**/lib/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/target/**',
    '!**/vendor/**',
    '!**/release/**',
    '!**/example/**',
    '!**/demo/**',
    '!**/doc/**',
    '!**/tmp/**',
    '!**/__tmp__/**',
    '!**/script/**',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    'global': {
      'branches': 60,
      'functions': 60,
      'lines': 60,
      'statements': 60
    }
  },
  coverageReporters: [
    'text',
    'text-summary'
  ]
}
