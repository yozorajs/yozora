import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { afterEach, before, describe, test } from 'node:test'
import { tsImport } from 'tsx/esm/api'
import { githubSlug, scanSourcePolicy, verifyMarkdownFiles } from './verify.mjs'

let parseMarkdown
before(async () => {
  const { default: YozoraParser } = await tsImport('@yozora/parser', import.meta.url)
  const parser = new YozoraParser({
    defaultParseOptions: { shouldReservePosition: true, formatUrl: url => url },
  })
  parseMarkdown = source => parser.parse(source)
})

describe('githubSlug', () => {
  test('matches emoji-prefixed GitHub heading anchors', () => {
    assert.equal(githubSlug('📄 License'), '-license')
  })
})

describe('scanSourcePolicy', () => {
  test('reports BOM, NUL, and missing final newlines', () => {
    assert.deepEqual(
      scanSourcePolicy('\ufefftext\0').map(issue => issue.rule),
      ['bom', 'nul', 'final-newline'],
    )
  })
})

describe('verifyMarkdownFiles', () => {
  let directory = null
  afterEach(() => {
    if (directory != null) rmSync(directory, { recursive: true, force: true })
    directory = null
  })

  test('ignores links and version strings in Markdown code', () => {
    directory = mkdtempSync(join(tmpdir(), 'yozora-markdown-'))
    mkdirSync(join(directory, 'package'))
    writeFileSync(
      join(directory, 'package/package.json'),
      JSON.stringify({ name: '@yozora/example', version: '2.4.0' }),
    )
    writeFileSync(
      join(directory, 'package/README.md'),
      '`[inline](./missing-inline.md)`\n\n' +
        '    [indented](./missing-indented.md)\n\n' +
        '[^note]: explanatory text\n\n' +
        '```text\n' +
        'https://github.com/yozorajs/yozora/tree/v1.0.0/packages/example\n',
    )

    assert.deepEqual(verifyMarkdownFiles(directory, ['package/README.md'], parseMarkdown), [])
  })

  test('checks generated regions through HTML nodes only', () => {
    directory = mkdtempSync(join(tmpdir(), 'yozora-markdown-'))
    writeFileSync(
      join(directory, 'README.md'),
      '```html\n<!-- :begin use ignored -->\n```\n\n<!-- :begin use actual -->\n',
    )

    const issues = verifyMarkdownFiles(directory, ['README.md'], parseMarkdown)
    assert.deepEqual(
      issues.map(issue => issue.rule),
      ['generated-region'],
    )
  })

  test('checks nested destinations and real HTML anchors', () => {
    directory = mkdtempSync(join(tmpdir(), 'yozora-markdown-'))
    writeFileSync(join(directory, 'a_(b).md'), '## Target\n')
    writeFileSync(
      join(directory, 'README.md'),
      '<input name="not-an-anchor">\n\n' +
        '<a name="real-anchor"></a>\n\n' +
        '[nested](./a_(b).md#target)\n\n' +
        '[invalid](#not-an-anchor)\n\n' +
        '[valid](#real-anchor)\n',
    )

    const issues = verifyMarkdownFiles(directory, ['README.md', 'a_(b).md'], parseMarkdown)
    assert.deepEqual(
      issues.map(issue => issue.rule),
      ['local-anchor'],
    )
  })

  test('rejects local targets outside the repository', () => {
    directory = mkdtempSync(join(tmpdir(), 'yozora-markdown-'))
    const outside = relative(directory, '/etc/passwd')
    writeFileSync(join(directory, 'README.md'), `[outside](${outside})\n`)

    const issues = verifyMarkdownFiles(directory, ['README.md'], parseMarkdown)
    assert.deepEqual(
      issues.map(issue => issue.rule),
      ['local-link'],
    )
    assert.match(issues[0].message, /escapes the repository/u)
  })

  test('checks duplicate definitions, local anchors, and package version links', () => {
    directory = mkdtempSync(join(tmpdir(), 'yozora-markdown-'))
    mkdirSync(join(directory, 'package'))
    writeFileSync(
      join(directory, 'package/package.json'),
      JSON.stringify({ name: '@yozora/example', version: '2.4.0' }),
    )
    writeFileSync(
      join(directory, 'package/README.md'),
      '<a href="#license">License</a>\n\n' +
        '## 📄 License\n\n' +
        '[foo]: /first\n' +
        '[foo]: /second\n\n' +
        '<a href="https://github.com/yozorajs/yozora/tree/v2.3.17/packages/example">old</a>\n',
    )

    const issues = verifyMarkdownFiles(directory, ['package/README.md'], parseMarkdown)
    assert.deepEqual(
      issues.map(issue => issue.rule),
      ['local-anchor', 'duplicate-definition', 'version-link'],
    )
  })

  test('accepts valid cross-file anchors', () => {
    directory = mkdtempSync(join(tmpdir(), 'yozora-markdown-'))
    writeFileSync(join(directory, 'README.md'), '[target](./target.md#section)\n')
    writeFileSync(join(directory, 'target.md'), '## Section\n')

    assert.deepEqual(verifyMarkdownFiles(directory, ['README.md', 'target.md'], parseMarkdown), [])
  })
})
