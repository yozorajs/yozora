import type { Admonition, Image, Link, Paragraph, Root, Text } from '@yozora/ast'
import { describe, expect, test } from 'vitest'
import { loadJSONFixture } from 'vitest.setup'
import { defaultUrlResolver, resolveUrlsForAst } from '../src'

describe('defaultUrlResolver', function () {
  test.each([
    ['relative path', 'guide', 'https://base.example/docs/guide'],
    ['absolute path', '/root', '/root'],
    ['HTTP URL', 'https://other.example/page', 'https://other.example/page'],
    ['mailto URI', 'mailto:user@example.com', 'mailto:user@example.com'],
    ['data URI', 'data:text/plain,hello', 'data:text/plain,hello'],
    ['custom URI scheme', 'git+ssh://git@example.com/repo', 'git+ssh://git@example.com/repo'],
  ])('resolves %s', (_name, resource, expected) => {
    expect(defaultUrlResolver('https://base.example/docs', resource)).toBe(expected)
  })

  test.each([
    ['adjacent current-directory segments', ['/a', './', './b'], '/a/b'],
    ['parent-directory segments in an absolute URL', ['https://x/a', '../../b'], 'https://x/b'],
    ['leading parent-directory segments', ['a', '../../b'], '../b'],
    ['fragment-only reference', ['https://x/a', '#frag'], 'https://x/a#frag'],
    ['query-only reference', ['https://x/a', '?q=1'], 'https://x/a?q=1'],
    ['fragment after a query', ['https://x/a?old=1', '#frag'], 'https://x/a?old=1#frag'],
    ['replacement fragment', ['https://x/a?q=1#old', '#new'], 'https://x/a?q=1#new'],
    ['replacement query', ['https://x/a?old=1#old', '?q=1'], 'https://x/a?q=1'],
    ['relative path after a suffix', ['https://x/a?q=1#old', 'b'], 'https://x/a/b'],
    ['slashes inside a query', ['https://x/a', '?next=/b//c'], 'https://x/a?next=/b//c'],
    ['suffix on a relative path', ['https://x/a', 'b?q=1#frag'], 'https://x/a/b?q=1#frag'],
    ['protocol-relative URL', ['prefix', '//cdn.example/a', '../b'], '//cdn.example/b'],
    ['trailing dot segment', ['https://x/a', './'], 'https://x/a/'],
    [
      'opaque blob URL',
      ['blob:https://example.com/550e8400-e29b-41d4-a716-446655440000'],
      'blob:https://example.com/550e8400-e29b-41d4-a716-446655440000',
    ],
    [
      'opaque blob URL with suffix',
      ['blob:https://example.com/id?download=1#part'],
      'blob:https://example.com/id?download=1#part',
    ],
    ['opaque data URI', ['prefix', 'data:text/plain,a/../b'], 'data:text/plain,a/../b'],
    ['opaque mailto URI', ['mailto:user/../admin@example.com'], 'mailto:user/../admin@example.com'],
    ['opaque URN', ['urn:example:a/../b'], 'urn:example:a/../b'],
    ['hierarchical custom URI', ['custom:/a/../b'], 'custom:/b'],
  ])('normalizes %s', (_name, pathPieces, expected) => {
    expect(defaultUrlResolver(...pathPieces)).toBe(expected)
  })
})

describe('resolveUrlsForAst', function () {
  test('basic1', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')

    resolveUrlsForAst(ast, undefined, p => 'waw-' + p)
    expect(ast).toMatchSnapshot()
    expect(ast).not.toEqual(originalAst)
  })

  test('defaultUrlResolver', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')

    resolveUrlsForAst(ast)
    expect(ast).toMatchSnapshot()
    expect(ast).not.toEqual(originalAst)
  })

  test('resolves resources in admonition titles and bodies once', function () {
    const createText = (value: string): Text => ({ type: 'text', value })
    const createLink = (url: string, value: string): Link => ({
      type: 'link',
      url,
      children: [createText(value)],
    })
    const titleLink = createLink('./title-link', 'title')
    const titleImage: Image = { type: 'image', url: './title-image', alt: 'image' }
    const bodyLink = createLink('./body-link', 'body')
    const body: Paragraph = { type: 'paragraph', children: [bodyLink] }
    const admonition: Admonition = {
      type: 'admonition',
      keyword: 'note',
      title: [titleLink, titleImage],
      children: [body],
    }
    const ast: Root = {
      type: 'root',
      children: [admonition],
    }
    const resolvedUrls: string[] = []

    resolveUrlsForAst(ast, undefined, url => {
      if (typeof url !== 'string') throw new TypeError('Expected a URL string')
      resolvedUrls.push(url)
      return 'resolved:' + url
    })

    expect(resolvedUrls).toEqual(['./body-link', './title-link', './title-image'])
    expect(titleLink.url).toBe('resolved:./title-link')
    expect(titleImage.url).toBe('resolved:./title-image')
    expect(bodyLink.url).toBe('resolved:./body-link')
  })
})
