import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { repositoryRoot } from '../internal/repository.mjs'
import { workspacePackages } from '../internal/workspace.mjs'

const packages = workspacePackages().filter(ws => ws.manifest.private !== true)
assert.ok(packages.length > 0, 'expected at least one dual CJS/ESM package entrypoint')

const consumerDir = mkdtempSync(path.join(tmpdir(), 'yozora-entrypoints-'))
try {
  const imports = []
  for (const [index, ws] of packages.entries()) {
    const packageDir = path.join(repositoryRoot, ws.dir)
    const entry = ws.manifest.exports?.['.'] ?? ws.manifest.exports
    for (const condition of ['import', 'require', 'types']) {
      assert.equal(
        typeof entry?.[condition],
        'string',
        `${ws.name} is missing exports.${condition}`,
      )
      assert.ok(
        statSync(path.join(packageDir, entry[condition])).isFile(),
        `${ws.name} exports.${condition} is not a file`,
      )
    }

    const packageLink = path.join(consumerDir, 'node_modules', ws.name)
    mkdirSync(path.dirname(packageLink), { recursive: true })
    symlinkSync(packageDir, packageLink, 'junction')
    imports.push(`export * as package${index} from ${JSON.stringify(ws.name)}`)
  }

  // Resolve both module formats through package exports, as downstream consumers do.
  const consumerPath = path.join(consumerDir, 'consumer.mjs')
  writeFileSync(consumerPath, imports.join('\n'))
  const modules = await import(pathToFileURL(consumerPath))
  const require = createRequire(consumerPath)
  const declarations = []

  for (const [index, ws] of packages.entries()) {
    const esm = modules[`package${index}`]
    const cjs = require(ws.name)
    const names = Object.keys(esm).sort()
    assert.ok(names.length > 0, `${ws.name} has no runtime exports`)
    assert.deepEqual(Object.keys(cjs).sort(), names, `${ws.name} has different CJS and ESM exports`)
    for (const name of names) {
      assert.equal(
        typeof cjs[name],
        typeof esm[name],
        `${ws.name} export ${name} has different types`,
      )
    }
    if (ws.name.startsWith('@yozora/parser-')) {
      const markdown = '# Heading\n\nText with **strong** and [link](https://example.com).\n'
      const options = { shouldReservePosition: false }
      const esmAst = new esm.default().parse(markdown, options)
      const cjsAst = new cjs.default().parse(markdown, options)
      assert.equal(esmAst.children[0].type, 'heading', `${ws.name} failed to parse a heading`)
      assert.deepEqual(cjsAst, esmAst, `${ws.name} has different CJS and ESM parsing behavior`)
    }
    if (ws.name === '@yozora/markup' || ws.name.startsWith('@yozora/markup-')) {
      const ast = {
        type: 'root',
        children: [{ type: 'paragraph', children: [{ type: 'text', value: 'text' }] }],
      }
      assert.equal(esm.default, esm.DefaultMarkupWeaver, `${ws.name} has inconsistent defaults`)
      assert.equal(cjs.default, cjs.DefaultMarkupWeaver, `${ws.name} has inconsistent CJS defaults`)
      assert.equal(new esm.default().weave(ast), 'text', `${ws.name} failed to weave text`)
      assert.equal(new cjs.default().weave(ast), 'text', `${ws.name} failed to weave CJS text`)
    }

    const exports = names.map((name, i) => `${name} as package${index}_${i}`).join(', ')
    declarations.push(`export { ${exports} } from ${JSON.stringify(ws.name)}`)
  }

  declarations.push(
    '// @ts-expect-error Internal helper types must remain private.',
    "import type { IDelimiterProcessorHook } from '@yozora/parser'",
  )
  for (const extension of ['mts', 'cts']) {
    writeFileSync(path.join(consumerDir, `consumer.${extension}`), declarations.join('\n'))
  }
  const tsconfigPath = path.join(consumerDir, 'tsconfig.json')
  writeFileSync(
    tsconfigPath,
    JSON.stringify({
      compilerOptions: {
        target: 'esnext',
        module: 'nodenext',
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        types: [],
      },
      files: ['consumer.mts', 'consumer.cts'],
    }),
  )
  const result = spawnSync('tsc', ['--project', tsconfigPath], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  assert.ifError(result.error)
  assert.equal(result.status, 0, `Declaration consumers failed:\n${result.stdout}${result.stderr}`)
} finally {
  rmSync(consumerDir, { recursive: true, force: true })
}

console.log(
  `Verified ${packages.length} packages: CJS/ESM exports, parser behavior, and NodeNext declaration consumers.`,
)
