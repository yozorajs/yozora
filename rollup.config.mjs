import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import { builtinModules } from 'node:module'
import path from 'node:path'
import { dts } from 'rollup-plugin-dts'

const shouldSourcemap = process.env.ROLLUP_SHOULD_SOURCEMAP === 'true'
const removeComments = process.env.NODE_ENV === 'production'

const { default: manifest } = await import(path.resolve('package.json'), {
  with: { type: 'json' },
})

const deps = new Set([
  ...builtinModules,
  ...builtinModules.map(m => `node:${m}`),
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {}),
  ...Object.keys(manifest.optionalDependencies ?? {}),
])
const external = id => {
  if (id.startsWith('.') || path.isAbsolute(id)) return false
  const match = /^(@[^/]+\/[^/]+|[^/]+)/.exec(id)
  return match ? deps.has(match[1]) : false
}

const entry = manifest.exports?.['.'] ?? manifest.exports ?? {}
const input = entry.source ?? manifest.source ?? './src/index.ts'
const esm = entry.import ?? manifest.module
const cjs = entry.require ?? manifest.main
const types = entry.types ?? manifest.types

const tsPlugins = [
  nodeResolve({ preferBuiltins: true, extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] }),
  json(),
  typescript({
    tsconfig: 'tsconfig.lib.json',
    compilerOptions: {
      declaration: false,
      declarationMap: false,
      sourceMap: shouldSourcemap,
      removeComments,
    },
  }),
  commonjs(),
]

const configs = []

if (esm || cjs) {
  const output = []
  if (esm) output.push({ file: esm, format: 'esm', exports: 'named', sourcemap: shouldSourcemap })
  if (cjs) output.push({ file: cjs, format: 'cjs', exports: 'named', sourcemap: shouldSourcemap })
  configs.push({ input, output, external, plugins: tsPlugins })
}

if (types) {
  configs.push({
    input,
    output: { file: types, format: 'esm' },
    external,
    plugins: [dts({ tsconfig: 'tsconfig.lib.json', respectExternal: true })],
  })
}

export default configs
