import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/blockquote').runTest(),
)

test('handles tabs after blockquote markers consistently', () => {
  expect(parsers.gfm.parse('>\t\tfoo\n>\t\tbar')).toMatchObject({
    children: [
      {
        type: 'blockquote',
        children: [{ type: 'code', value: '  foo\n  bar\n' }],
      },
    ],
  })
})
