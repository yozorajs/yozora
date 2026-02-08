import path from 'node:path'
import url from 'node:url'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    include: ['__test__/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/lib/**'],
    passWithNoTests: true,
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['**/node_modules/**', '**/__test__/**', '**/lib/**'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      'vitest.setup': path.resolve(__dirname, 'vitest.setup.ts'),
      '@yozora/test-util': path.resolve(__dirname, 'packages/test-util/src/index.ts'),
    },
  },
})
