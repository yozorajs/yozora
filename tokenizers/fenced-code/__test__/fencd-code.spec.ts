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
