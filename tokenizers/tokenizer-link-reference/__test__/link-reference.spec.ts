import { expect, test } from 'vitest'
import { parsers, scanGfmFixtures } from 'vitest.setup'
import { createTokenizerTesters } from '../../../script/test/index.mjs'

createTokenizerTesters(
  ['gfm', parsers.gfm],
  ['gfm-ex', parsers.gfmEx],
  ['yozora', parsers.yozora],
).forEach(tester => {
  scanGfmFixtures(tester, {
    includeGroups: ['image', 'link', 'image-reference', 'link-reference'],
  })
    .scan('custom/link-reference')
    .runTest()
})

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
