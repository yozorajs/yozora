import type { Root } from '@yozora/ast'
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
})
