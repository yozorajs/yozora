import type { Admonition, Image, Link, Paragraph, Root, Text } from '@yozora/ast'
import { describe, expect, test } from 'vitest'
import { loadJSONFixture } from 'vitest.setup'
import { defaultUrlResolver, resolveUrlsForAst } from '../src'

describe('defaultUrlResolver', function () {
  test('ignores missing and blank path pieces while trimming nonempty pieces', function () {
    expect(defaultUrlResolver(null, '', undefined, ' \t ')).toBe('')
    expect(defaultUrlResolver(' https://x/a ', null, ' ', undefined, ' b ')).toBe('https://x/a/b')
  })

  test.each([
    ['', ''],
    ['?q=1', '?q=1'],
    ['#part', '#part'],
    ['.', './'],
    ['./', './'],
    ['a/..', './'],
    ['a/../?q=1#part', './?q=1#part'],
    ['./custom:chapter', './custom:chapter'],
    ['a/../custom:chapter?q=1#part', './custom:chapter?q=1#part'],
    ['./javascript:alert(1)', './javascript:alert(1)'],
  ])('preserves the relative URL target of %s', (source, expected) => {
    const base = 'https://example.test/docs/page.html'
    const resolved = defaultUrlResolver(source)

    expect(resolved).toBe(expected)
    expect(new URL(resolved, base).href).toBe(new URL(source, base).href)
  })

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
    ['opaque about URI', ['about:foo/../bar'], 'about:foo/../bar'],
    ['opaque JavaScript URI', ['javascript:render("/a/../b")'], 'javascript:render("/a/../b")'],
    ['rootless custom URI', ['pkg:docs/a/../b'], 'pkg:docs/a/../b'],
    ['single-slash custom URI', ['custom:/a/../b'], 'custom:/a/../b'],
    ['authority-based custom URI', ['custom://host/a/../b'], 'custom://host/b'],
  ])('normalizes %s', (_name, pathPieces, expected) => {
    expect(defaultUrlResolver(...pathPieces)).toBe(expected)
  })
})

describe('resolveUrlsForAst', function () {
  test('preserves relative resource targets during default URL normalization', function () {
    const parentLink: Link = { type: 'link', url: 'a/..', children: [] }
    const colonLink: Link = { type: 'link', url: './custom:chapter', children: [] }
    const paragraph: Paragraph = { type: 'paragraph', children: [parentLink, colonLink] }
    const ast: Root = { type: 'root', children: [paragraph] }

    resolveUrlsForAst(ast)

    expect(parentLink.url).toBe('./')
    expect(colonLink.url).toBe('./custom:chapter')
  })

  test('resolves an admonition body when its title is empty', function () {
    const link: Link = { type: 'link', url: 'body', children: [] }
    const paragraph: Paragraph = { type: 'paragraph', children: [link] }
    const admonition: Admonition = {
      type: 'admonition',
      keyword: 'note',
      title: [],
      children: [paragraph],
    }
    const ast: Root = { type: 'root', children: [admonition] }

    resolveUrlsForAst(ast, undefined, url => defaultUrlResolver('/base', url))

    expect(link.url).toBe('/base/body')
    expect(admonition.title).toEqual([])
  })

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
