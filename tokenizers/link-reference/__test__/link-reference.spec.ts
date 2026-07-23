import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester
    .scan([
      'gfm/image',
      'gfm/link',
      'gfm/image-reference',
      'gfm/link-reference',
      'custom/link-reference',
    ])
    .runTest(),
)

test('does not create a link reference containing another link through a footnote', () => {
  const ast = parsers.yozora.parse('[outer ^[[inner](u)]][x]\n\n[x]: /v', {
    shouldReservePosition: false,
  })

  expect(ast.children[0]).toEqual({
    type: 'paragraph',
    children: [
      { type: 'text', value: '[outer ' },
      {
        type: 'footnote',
        children: [
          {
            type: 'link',
            url: 'u',
            children: [{ type: 'text', value: 'inner' }],
          },
        ],
      },
      { type: 'text', value: ']' },
      {
        type: 'linkReference',
        identifier: 'x',
        label: 'x',
        referenceType: 'shortcut',
        children: [{ type: 'text', value: 'x' }],
      },
    ],
  })
})
