import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers, scanGfmFixtures } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester => {
  scanGfmFixtures(tester, { includeGroups: ['image'] }).runTest()
})

test('image node should omit position when shouldReservePosition is false', function () {
  const ast = parsers.gfm.parse('![alt](<https://example.com> "title")', {
    shouldReservePosition: false,
  })
  const node = (ast.children[0] as any).children[0]

  expect(node.type).toBe('image')
  expect(node.url).toBe('https://example.com')
  expect(node.alt).toBe('alt')
  expect(node.title).toBe('title')
  expect(node.position).toBeUndefined()
})

test.each(['![x]()', '![x](<>)'])('formats an empty image destination in %s', source => {
  const formattedUrls: string[] = []
  const ast = parsers.gfm.parse(source, {
    shouldReservePosition: false,
    formatUrl: url => {
      formattedUrls.push(url)
      return `formatted:${url}`
    },
  })
  const node = (ast.children[0] as any).children[0]

  expect(formattedUrls).toEqual([''])
  expect(node).toMatchObject({ type: 'image', url: 'formatted:' })
})
