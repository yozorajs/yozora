import type { Table } from '@yozora/ast'
import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.yozora).forEach(tester =>
  tester.scan(['gfm/table', 'custom/table']).runTest(),
)

test('preserves a trailing backslash in the final table cell', function () {
  const options = { shouldReservePosition: false }
  const withoutTrailingLineEnding = parsers.yozora.parse('a|\n-|\n\\', options)
  const withTrailingLineEnding = parsers.yozora.parse('a|\n-|\n\\\n', options)

  expect(withoutTrailingLineEnding).toEqual(withTrailingLineEnding)
  const table = withoutTrailingLineEnding.children[0] as Table
  expect(table.children[1].children[0].children).toEqual([{ type: 'text', value: '\\' }])
})
