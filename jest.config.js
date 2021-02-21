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
  testURL: 'http://localhost/',
  testEnvironment: 'node',
  testRegex: '/(__test__)/[^/]+\\.spec\\.tsx?$',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/(build|dist|lib|release|target|vendor)/',
    '/(example|demo|doc)/',
    '/(tmp|__tmp__)/',
    '/script/',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/*.{js,jsx,ts,tsx}',
  ],
  coveragePathIgnorePatterns: [
    'packages/character/src/util/node-point.ts',
    'packages/parser-gfm/src/types.ts',
  ],
  coverageThreshold: {
    'global': {
      'branches': 50,
      'functions': 80,
      'lines': 60,
      'statements': 60,
    }
  },
  coverageReporters: [
    'text',
    'text-summary',
  ]
}
