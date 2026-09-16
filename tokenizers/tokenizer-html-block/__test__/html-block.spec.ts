import { expect, test } from 'vitest'
import { parsers, scanGfmFixtures } from 'vitest.setup'
import { createTokenizerTesters } from '../../../script/test/index.mjs'

createTokenizerTesters(
  ['gfm', parsers.gfm],
  ['gfm-ex', parsers.gfmEx],
  ['yozora', parsers.yozora],
).forEach(tester => {
  scanGfmFixtures(tester, { includeGroups: ['html-block'] }).runTest()
})

test('html block node should omit position when shouldReservePosition is false', function () {
  const ast = parsers.gfm.parse('<div>yozora</div>', { shouldReservePosition: false })
  const node = ast.children[0] as any

  expect(node.type).toBe('html')
  expect(node.value).toBe('<div>yozora</div>')
  expect(node.position).toBeUndefined()
})

test.each(['<![CDATA\nfoo', '<![CDATAx\nfoo'])(
  'does not recognize an incomplete CDATA opener: %s',
  input => {
    const ast = parsers.gfm.parse(input, { shouldReservePosition: false })

    expect(ast.children).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', value: input }],
      },
    ])
  },
)
