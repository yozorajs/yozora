import YozoraMarkupWeaver, { DefaultMarkupWeaver } from '@yozora/markup-yozora'
import YozoraParser from '@yozora/parser-yozora'
import { expect, test } from 'vitest'

test('exports the Yozora default under both import styles', () => {
  expect(DefaultMarkupWeaver).toBe(YozoraMarkupWeaver)
})

test.each(['$$\nx + y\n$$', 'text $x$', 'text ^[note]', "import Example from './example'"])(
  'round-trips a Yozora extension: %s',
  source => {
    const parser = new YozoraParser()
    const ast = parser.parse(source)
    expect(parser.parse(new YozoraMarkupWeaver().weave(ast))).toEqual(ast)
  },
)
