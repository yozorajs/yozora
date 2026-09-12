import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'tsdown'
import { repositoryRoot } from '../internal/repository.mjs'

export async function createDocumentationParser() {
  const outDir = await mkdtemp(path.join(tmpdir(), 'yozora-docs-parser-'))
  try {
    // Bundle workspace sources so documentation checks work before package builds.
    await build({
      config: false,
      cwd: repositoryRoot,
      entry: { parser: 'packages/parser/src/index.ts' },
      tsconfig: 'tsconfig.json',
      platform: 'node',
      target: 'node22.18',
      format: 'esm',
      dts: false,
      exports: false,
      outDir,
      outExtensions: () => ({ js: '.mjs' }),
      deps: { alwaysBundle: /^@yozora\//, onlyBundle: [] },
      logLevel: 'error',
      failOnWarn: true,
    })
    const { default: YozoraParser } = await import(pathToFileURL(path.join(outDir, 'parser.mjs')))
    return new YozoraParser({
      defaultParseOptions: { shouldReservePosition: true, formatUrl: url => url },
    })
  } finally {
    await rm(outDir, { recursive: true, force: true })
  }
}
