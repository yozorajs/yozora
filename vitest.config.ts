import path from 'node:path'
import url from 'node:url'
import { defineConfig } from 'vitest/config'
import { workspacePackages } from './script/workspace-aliases.mjs'

const WORKSPACE_ROOT = path.dirname(url.fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(process.cwd())
const pa = (p: string): string => path.join(WORKSPACE_ROOT, p)

// Derived from the single source of truth (see script/workspace-aliases.mjs) so
// the @yozora/* → src map is not hand-maintained here and in tsconfig.json.
const workspaceAliases: Record<string, string> = Object.fromEntries(
  workspacePackages(WORKSPACE_ROOT).map(({ name, dir }) => [name, pa(`${dir}/src/index.ts`)]),
)

export default defineConfig({
  test: {
    globals: true,
    include: ['__test__/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/lib/**'],
    passWithNoTests: true,
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      include: [path.join(PROJECT_ROOT, 'src/**')],
      exclude: ['**/node_modules/**', '**/__test__/**', '**/lib/**'],
      thresholds: {
        branches: 50,
        functions: 60,
        lines: 75,
        statements: 75,
      },
    },
  },
  resolve: {
    alias: {
      'vitest.setup': pa('vitest.setup.ts'),
      ...workspaceAliases,
    },
  },
})
