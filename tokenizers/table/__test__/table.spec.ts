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

test.each([
  ['left', ':---', 'left'],
  ['right', '---:', 'right'],
  ['center', ':---:', 'center'],
] as const)(
  'recognizes a pipe-less single-column table aligned %s',
  function (_, delimiter, align) {
    const ast = parsers.yozora.parse(`foo\n${delimiter}`, { shouldReservePosition: false })
    const table = ast.children[0] as Table

    expect(table.type).toBe('table')
    expect(table.columns).toEqual([{ align }])
    expect(table.children[0].children[0].children).toEqual([{ type: 'text', value: 'foo' }])
  },
)

test('preserves setext heading precedence for an unaligned delimiter', function () {
  const ast = parsers.yozora.parse('foo\n---', { shouldReservePosition: false })

  expect(ast.children).toMatchObject([
    { type: 'heading', depth: 2, children: [{ type: 'text', value: 'foo' }] },
  ])
})

test.each([
  ['a spaced empty cell', '| |\n| --- |', ['']],
  ['a compact empty cell', '||\n| --- |', ['']],
  ['an empty cell before text', '| | Name |\n| --- | --- |', ['', 'Name']],
] as const)('recognizes a table header containing %s', function (_, source, values) {
  const ast = parsers.yozora.parse(source, { shouldReservePosition: false })
  const table = ast.children[0] as Table

  expect(table.type).toBe('table')
  expect(table.columns).toHaveLength(values.length)
  expect(table.children[0].children).toEqual(
    values.map(value => ({
      type: 'tableCell',
      children: value === '' ? [] : [{ type: 'text', value }],
    })),
  )
})

test('does not treat a lone pipe as an empty header cell', function () {
  const ast = parsers.yozora.parse('|\n| --- |', { shouldReservePosition: false })

  expect(ast.children[0].type).toBe('paragraph')
})
