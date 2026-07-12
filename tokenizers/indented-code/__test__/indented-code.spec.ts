import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/indented-code').runTest(),
)

for (let spaceCount = 1; spaceCount <= 3; ++spaceCount) {
  test(`handles ${spaceCount}-space tab indentation consistently`, () => {
    const indent = ' '.repeat(spaceCount) + '\t'

    expect(parsers.gfm.parse(`${indent}foo\n${indent}bar`)).toMatchObject({
      children: [{ type: 'code', value: 'foo\nbar\n' }],
    })
  })
}
