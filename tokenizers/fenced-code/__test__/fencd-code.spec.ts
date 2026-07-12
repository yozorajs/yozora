import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan(['gfm/fenced-code', 'custom/fenced-code']).runTest(),
)

test('fenced code node should omit position when shouldReservePosition is false', function () {
  const ast = parsers.gfm.parse('```ts meta\nconsole.log(1)\n```', {
    shouldReservePosition: false,
  })
  const node = ast.children[0] as any

  expect(node.type).toBe('code')
  expect(node.lang).toBe('ts')
  expect(node.meta).toBe('meta')
  expect(node.position).toBeUndefined()
})

for (let indentWidth = 1; indentWidth <= 3; ++indentWidth) {
  test(`removes ${indentWidth}-column fence indentation from mixed whitespace`, () => {
    const fenceIndent = ' '.repeat(indentWidth)
    const expectedIndent = indentWidth === 1 ? '\t' : ' '.repeat(4 - indentWidth)

    expect(parsers.gfm.parse(`${fenceIndent}\`\`\`\n \tX\n${fenceIndent}\`\`\``)).toMatchObject({
      children: [{ type: 'code', value: `${expectedIndent}X\n` }],
    })
  })
}

test('recognizes fences after a partial tab in a list item', () => {
  expect(parsers.gfm.parse('1234. foo\n\n\t  \t```\n\t  X\n\t  \t```')).toMatchObject({
    children: [
      {
        type: 'list',
        children: [
          {
            children: [
              { type: 'paragraph', children: [{ type: 'text', value: 'foo' }] },
              { type: 'code', value: 'X\n' },
            ],
          },
        ],
      },
    ],
  })
})
