import { encodeLinkDestination } from '@yozora/core-tokenizer'
import { createTokenizerTesters } from '@yozora/test-util'
import { expect, test } from 'vitest'
import { parsers } from 'vitest.setup'

createTokenizerTesters(parsers.gfm, parsers.gfmEx, parsers.yozora).forEach(tester =>
  tester.scan('gfm/link').runTest(),
)

test('link node should omit position when shouldReservePosition is false', function () {
  const ast = parsers.gfm.parse('[home](https://example.com "site")', {
    shouldReservePosition: false,
  })
  const node = (ast.children[0] as any).children[0]

  expect(node.type).toBe('link')
  expect(node.url).toBe('https://example.com')
  expect(node.title).toBe('site')
  expect(node.position).toBeUndefined()
})

test.each([
  [
    'autolink after inline link',
    '[x](/u) <https://example.com/a>',
    [
      ['link', '/u'],
      ['text', ' '],
      ['link', 'https://example.com/a'],
    ],
  ],
  [
    'autolink before inline link',
    '<https://example.com/a> [x](/u)',
    [
      ['link', 'https://example.com/a'],
      ['text', ' '],
      ['link', '/u'],
    ],
  ],
  [
    'angle-bracket link destination',
    '[x](<https://example.com/a>)',
    [['link', 'https://example.com/a']],
  ],
])('resolves %s', (_description, input, expected) => {
  const ast = parsers.gfm.parse(input, { shouldReservePosition: false })
  const paragraph = ast.children[0] as any
  const actual = paragraph.children.map((node: any) => [node.type, node.url ?? node.value])

  expect(actual).toEqual(expected)
})

test.each([
  ['link', '[x]', 'link'],
  ['image', '![x]', 'image'],
])('limits nested parentheses in %s destinations', (_description, label, nodeType) => {
  const acceptedSource = `${label}(${'('.repeat(32)}url${')'.repeat(32)})`
  const rejectedSource = `${label}(${'('.repeat(33)}url${')'.repeat(33)})`

  const acceptedAst = parsers.gfm.parse(acceptedSource, { shouldReservePosition: false })
  const rejectedAst = parsers.gfm.parse(rejectedSource, { shouldReservePosition: false })
  const acceptedChildren = (acceptedAst.children[0] as any).children
  const rejectedChildren = (rejectedAst.children[0] as any).children

  expect(acceptedChildren[0].type).toBe(nodeType)
  expect(rejectedChildren.every((node: any) => node.type !== nodeType)).toBe(true)
})

test.each([
  ['https://example.com/%2Fadmin', 'https://example.com/%2Fadmin'],
  ['https://example.com/%252Fadmin', 'https://example.com/%252Fadmin'],
  ['https://example.com/%23frag', 'https://example.com/%23frag'],
  ['https://example.com/%3Fq%3D1', 'https://example.com/%3Fq%3D1'],
  ['foo%20b&auml;', 'foo%20b%C3%A4'],
  ['100%', '100%'],
  ['%ZZ', '%ZZ'],
  ['foo%2', 'foo%2'],
])('preserves URL escaping in %s', (source, expected) => {
  const ast = parsers.gfm.parse(`[x](${source})`, { shouldReservePosition: false })
  const node = (ast.children[0] as any).children[0]

  expect(node.url).toBe(expected)
})

test('preserves GitHub-safe ASCII characters', () => {
  const value = "AZaz09-_.+!*'(),%#@?=;:/&$~"

  expect(encodeLinkDestination(value)).toBe(value)
})

test.each([
  ['space', ' ', '%20'],
  ['double quote', '"', '%22'],
  ['backslash', '\\', '%5C'],
  ['open bracket', '[', '%5B'],
  ['close bracket', ']', '%5D'],
  ['vertical bar', '|', '%7C'],
  ['caret', '^', '%5E'],
  ['backtick', '`', '%60'],
  ['control character', '\u0001', '%01'],
])('encodes unsafe ASCII: %s', (_name, source, expected) => {
  expect(encodeLinkDestination(source)).toBe(expected)
})

test.each([
  ['BMP character', 'ä', '%C3%A4'],
  ['astral character', '😀', '%F0%9F%98%80'],
  ['lone high surrogate', '\uD800', '%EF%BF%BD'],
  ['lone low surrogate', '\uDC00', '%EF%BF%BD'],
])('encodes Unicode: %s', (_name, source, expected) => {
  expect(encodeLinkDestination(source)).toBe(expected)
})

test.each(['%2F', '%252F', '%ZZ', 'foo%2', '100%', 'foo bar', 'ä', '😀'])(
  'is idempotent for %s',
  source => {
    const encoded = encodeLinkDestination(source)

    expect(encodeLinkDestination(encoded)).toBe(encoded)
  },
)
