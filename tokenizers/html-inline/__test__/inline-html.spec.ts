import { createNodePointGenerator } from '@yozora/character'
import { createTokenizerTesters } from '@yozora/test-util'
import { HtmlInlineTokenizer } from '@yozora/tokenizer-html-inline'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/html-inline').runTest(),
)

test.each([
  ['processing instruction', '<?'],
  ['declaration', '<!A '],
  ['CDATA section', '<![CDATA['],
])('does not rescan unclosed %s suffixes', (_description, prefix) => {
  const source = `x ${prefix.repeat(500)}`
  const originalNodePoints = Array.from(createNodePointGenerator(source)).flat()
  let nodePointReads = 0
  const nodePoints = new Proxy(originalNodePoints, {
    get: (target, property, receiver) => {
      if (typeof property === 'string' && Number.isInteger(Number(property))) {
        nodePointReads += 1
      }
      return Reflect.get(target, property, receiver)
    },
  })
  const hook = new HtmlInlineTokenizer().match({ getNodePoints: () => nodePoints } as any)
  const findDelimiter = hook.findDelimiter()
  findDelimiter.next()

  expect(findDelimiter.next([0, nodePoints.length]).value).toBeNull()
  expect(nodePointReads).toBeLessThan(nodePoints.length * 64)
})

test.each([
  ['processing instruction', '<?x?>'],
  ['declaration', '<!A x>'],
  ['CDATA section', '<![CDATA[x]]>'],
])('finds a %s closer when the search range expands', (_description, source) => {
  const nodePoints = Array.from(createNodePointGenerator(source)).flat()
  const hook = new HtmlInlineTokenizer().match({ getNodePoints: () => nodePoints } as any)
  const findDelimiter = hook.findDelimiter()
  findDelimiter.next()

  expect(findDelimiter.next([0, nodePoints.length - 1]).value).toBeNull()
  expect(findDelimiter.next([0, nodePoints.length]).value).toMatchObject({
    type: 'full',
    startIndex: 0,
    endIndex: nodePoints.length,
  })
})

test.each([
  ['processing instruction', '<?ok?> <?', 7, 6],
  ['declaration', '<!A ok> <!B ', 8, 7],
  ['CDATA section', '<![CDATA[ok]]> <![CDATA[', 15, 14],
])(
  'isolates %s caches between delimiter iterators',
  (_description, source, startIndex, endIndex) => {
    const nodePoints = Array.from(createNodePointGenerator(source)).flat()
    const hook = new HtmlInlineTokenizer().match({ getNodePoints: () => nodePoints } as any)
    const firstFinder = hook.findDelimiter()
    const secondFinder = hook.findDelimiter()
    firstFinder.next()
    secondFinder.next()

    expect(secondFinder.next([startIndex, nodePoints.length]).value).toBeNull()
    expect(firstFinder.next([0, nodePoints.length]).value).toMatchObject({
      startIndex: 0,
      endIndex,
    })
  },
)

test.each([
  ['processing instruction', '<?ok?> ', '<?'],
  ['declaration', '<!A ok> ', '<!B '],
  ['CDATA section', '<![CDATA[ok]]> ', '<![CDATA['],
])('matches stateless %s results under interleaved queries', (_description, valid, invalid) => {
  const nodePoints = Array.from(createNodePointGenerator(valid + invalid.repeat(8))).flat()
  const hook = new HtmlInlineTokenizer().match({ getNodePoints: () => nodePoints } as any)
  const finders = [hook.findDelimiter(), hook.findDelimiter()]
  const startIndices = [0, valid.length]
  for (const finder of finders) finder.next()

  for (let i = 0; i < 12; ++i) {
    const finderIndex = i % finders.length
    const rangeIndex: [number, number] = [
      startIndices[finderIndex],
      i < finders.length ? nodePoints.length - 1 : nodePoints.length,
    ]
    const expectedHook = new HtmlInlineTokenizer().match({
      getNodePoints: () => nodePoints,
    } as any)
    const expectedFinder = expectedHook.findDelimiter()
    expectedFinder.next()

    expect(finders[finderIndex].next(rangeIndex).value).toEqual(
      expectedFinder.next(rangeIndex).value,
    )
    startIndices[finderIndex] += 1
  }
})
