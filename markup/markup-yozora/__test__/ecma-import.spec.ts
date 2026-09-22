import type { EcmaImport, Root } from '@yozora/ast'
import GfmMarkupWeaver from '@yozora/markup-gfm'
import GfmExMarkupWeaver from '@yozora/markup-gfm-ex'
import YozoraMarkupWeaver from '@yozora/markup-yozora'
import GfmParser from '@yozora/parser-gfm'
import GfmExParser from '@yozora/parser-gfm-ex'
import YozoraParser from '@yozora/parser-yozora'
import { expect, test } from 'vitest'

test.each(["'", '"'])('preserves import quote %s across parser flavors', quote => {
  const flavors = [
    [new GfmParser(), new GfmMarkupWeaver()],
    [new GfmExParser(), new GfmExMarkupWeaver()],
    [new YozoraParser(), new YozoraMarkupWeaver()],
  ] as const

  for (const prefix of [
    'import ',
    'import Foo from ',
    'import { bar } from ',
    'import Foo, { bar as baz } from ',
  ]) {
    const source = `${prefix}${quote}pkg${quote};`
    for (const [parser, weaver] of flavors) {
      const ast = parser.parse(source, { shouldReservePosition: false })
      const restoredAst: Root = JSON.parse(JSON.stringify(ast))
      const markup = weaver.weave(restoredAst)
      expect(markup).toBe(source)
      expect(parser.parse(markup, { shouldReservePosition: false })).toEqual(ast)
    }
  }
})

test.each([null, 'Foo'])(
  'defaults to double quotes for an AST without quote: %s',
  defaultImport => {
    const node: EcmaImport = {
      type: 'ecmaImport',
      moduleName: 'pkg',
      defaultImport,
      namedImports: [],
    }
    const ast: Root = { type: 'root', children: [node] }
    expect(new YozoraMarkupWeaver().weave(ast)).toBe(
      defaultImport ? 'import Foo from "pkg";' : 'import "pkg";',
    )
  },
)
