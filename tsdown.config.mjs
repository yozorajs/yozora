import { isBuiltin } from 'node:module'
import path from 'node:path'
import { defineConfig } from 'tsdown'

const { default: manifest } = await import(path.resolve('package.json'), {
  with: { type: 'json' },
})
const entrypoints = manifest.exports?.['.'] ?? manifest.exports

const common = {
  cwd: process.cwd(),
  entry: { index: manifest.source },
  tsconfig: 'tsconfig.lib.json',
  target: 'esnext',
  platform: 'neutral',
  // tsdown externalizes production dependencies; also keep Node built-ins external.
  deps: { neverBundle: isBuiltin, onlyBundle: [] },
  clean: true,
  exports: false,
}

export default defineConfig([
  ...[
    ['esm', entrypoints.import],
    ['cjs', entrypoints.require],
  ].map(([format, file]) => ({
    ...common,
    format,
    outDir: path.dirname(file),
    outExtensions: () => ({ js: path.extname(file) }),
    sourcemap: process.env.BUILD_SOURCEMAP === 'true',
    cjsDefault: false,
    dts: false,
    outputOptions: {
      comments: process.env.NODE_ENV !== 'production',
    },
  })),
  {
    ...common,
    format: 'esm',
    outDir: path.dirname(entrypoints.types),
    outExtensions: () => ({ dts: '.d.ts' }),
    sourcemap: false,
    // Keep non-exported helper types private in declaration files.
    footer: { dts: 'export {};' },
    dts: {
      generator: 'tsgo',
      emitDtsOnly: true,
      sourcemap: false,
      compilerOptions: { declarationMap: false },
    },
  },
])
