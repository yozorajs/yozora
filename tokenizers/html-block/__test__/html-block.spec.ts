import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/html-block').runTest(),
)

test('html block node should omit position when shouldReservePosition is false', function () {
  const ast = parsers.gfm.parse('<div>yozora</div>', { shouldReservePosition: false })
  const node = ast.children[0] as any

  expect(node.type).toBe('html')
  expect(node.value).toBe('<div>yozora</div>')
  expect(node.position).toBeUndefined()
})
