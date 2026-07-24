import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers, scanGfmFixtures } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  scanGfmFixtures(tester, { includeGroups: ['emphasis'] }).runTest(),
)

test.each(['\u061d', '\u{11f43}'])(
  'does not open emphasis before Unicode punctuation %s',
  punctuation => {
    const value = `a*${punctuation}foo*`

    expect(parsers.gfm.parse(value, { shouldReservePosition: false })).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value }],
        },
      ],
    })
  },
)
