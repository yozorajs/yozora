import path from 'node:path'
import url from 'node:url'
import { defineConfig } from 'vitest/config'
import coverageConfig from './coverage.json' with { type: 'json' }
import { yozoraWorkspacePackages } from './script/internal/workspace.mjs'

const WORKSPACE_ROOT = path.dirname(url.fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(process.cwd())
const pa = (p: string): string => path.join(WORKSPACE_ROOT, p)

// Derived from the single source of truth (see script/internal/workspace.mjs) so
// the @yozora/* → src map is not hand-maintained here and in tsconfig.json.
const workspaceAliases: Record<string, string> = Object.fromEntries(
  yozoraWorkspacePackages(WORKSPACE_ROOT).map(({ name, dir }) => [name, pa(`${dir}/src/index.ts`)]),
)

const { provider } = coverageConfig
if (provider !== 'v8' && provider !== 'istanbul') {
  throw new Error(`Unsupported coverage provider in coverage.json: ${provider}`)
}

const packagePath = path.relative(WORKSPACE_ROOT, PROJECT_ROOT).split(path.sep).join('/')
const coverageOverrides: Record<
  string,
  Partial<typeof coverageConfig.defaults>
> = coverageConfig.overrides

export default defineConfig({
  test: {
    globals: true,
    include: ['__test__/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/lib/**'],
    passWithNoTests: true,
    testTimeout: 10000,
    coverage: {
      provider,
      include: coverageConfig.include.map(pattern => path.join(PROJECT_ROOT, pattern)),
      exclude: coverageConfig.exclude,
      thresholds: {
        ...coverageConfig.defaults,
        ...coverageOverrides[packagePath],
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
