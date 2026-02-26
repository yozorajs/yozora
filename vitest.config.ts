import path from 'node:path'
import url from 'node:url'
import { defineConfig } from 'vitest/config'

const WORKSPACE_ROOT = path.dirname(url.fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(process.cwd())
const pa = (p: string): string => path.join(WORKSPACE_ROOT, p)

const workspaceAliases: Record<string, string> = {
  '@yozora/ast': pa('packages/ast/src/index.ts'),
  '@yozora/ast-util': pa('packages/ast-util/src/index.ts'),
  '@yozora/character': pa('packages/character/src/index.ts'),
  '@yozora/core-parser': pa('packages/core-parser/src/index.ts'),
  '@yozora/core-tokenizer': pa('packages/core-tokenizer/src/index.ts'),
  '@yozora/invariant': pa('packages/invariant/src/index.ts'),
  '@yozora/markup-weaver': pa('packages/markup-weaver/src/index.ts'),
  '@yozora/parser': pa('packages/parser/src/index.ts'),
  '@yozora/parser-gfm': pa('packages/parser-gfm/src/index.ts'),
  '@yozora/parser-gfm-ex': pa('packages/parser-gfm-ex/src/index.ts'),
  '@yozora/test-util': pa('packages/test-util/src/index.ts'),
  '@yozora/tokenizer-admonition': pa('tokenizers/admonition/src/index.ts'),
  '@yozora/tokenizer-autolink': pa('tokenizers/autolink/src/index.ts'),
  '@yozora/tokenizer-autolink-extension': pa('tokenizers/autolink-extension/src/index.ts'),
  '@yozora/tokenizer-blockquote': pa('tokenizers/blockquote/src/index.ts'),
  '@yozora/tokenizer-break': pa('tokenizers/break/src/index.ts'),
  '@yozora/tokenizer-definition': pa('tokenizers/definition/src/index.ts'),
  '@yozora/tokenizer-delete': pa('tokenizers/delete/src/index.ts'),
  '@yozora/tokenizer-ecma-import': pa('tokenizers/ecma-import/src/index.ts'),
  '@yozora/tokenizer-emphasis': pa('tokenizers/emphasis/src/index.ts'),
  '@yozora/tokenizer-fenced-block': pa('tokenizers/fenced-block/src/index.ts'),
  '@yozora/tokenizer-fenced-code': pa('tokenizers/fenced-code/src/index.ts'),
  '@yozora/tokenizer-footnote': pa('tokenizers/footnote/src/index.ts'),
  '@yozora/tokenizer-footnote-definition': pa('tokenizers/footnote-definition/src/index.ts'),
  '@yozora/tokenizer-footnote-reference': pa('tokenizers/footnote-reference/src/index.ts'),
  '@yozora/tokenizer-heading': pa('tokenizers/heading/src/index.ts'),
  '@yozora/tokenizer-html-block': pa('tokenizers/html-block/src/index.ts'),
  '@yozora/tokenizer-html-inline': pa('tokenizers/html-inline/src/index.ts'),
  '@yozora/tokenizer-image': pa('tokenizers/image/src/index.ts'),
  '@yozora/tokenizer-image-reference': pa('tokenizers/image-reference/src/index.ts'),
  '@yozora/tokenizer-indented-code': pa('tokenizers/indented-code/src/index.ts'),
  '@yozora/tokenizer-inline-code': pa('tokenizers/inline-code/src/index.ts'),
  '@yozora/tokenizer-inline-math': pa('tokenizers/inline-math/src/index.ts'),
  '@yozora/tokenizer-link': pa('tokenizers/link/src/index.ts'),
  '@yozora/tokenizer-link-reference': pa('tokenizers/link-reference/src/index.ts'),
  '@yozora/tokenizer-list': pa('tokenizers/list/src/index.ts'),
  '@yozora/tokenizer-math': pa('tokenizers/math/src/index.ts'),
  '@yozora/tokenizer-paragraph': pa('tokenizers/paragraph/src/index.ts'),
  '@yozora/tokenizer-setext-heading': pa('tokenizers/setext-heading/src/index.ts'),
  '@yozora/tokenizer-table': pa('tokenizers/table/src/index.ts'),
  '@yozora/tokenizer-text': pa('tokenizers/text/src/index.ts'),
  '@yozora/tokenizer-thematic-break': pa('tokenizers/thematic-break/src/index.ts'),
}

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
