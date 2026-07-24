import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { describe, test } from 'node:test'
import { fetchLatestGfmExamples, parseGfmSpec } from './update.mjs'

const fence = '`'.repeat(32)
const spec = `# First section

${fence} example autolink
foo→bar
.
<p>foo→bar</p>
${fence}

## Task list items (extension)

${fence} example disabled
- [ ] foo
.
<ul><li>foo</li></ul>
${fence}
`

describe('parseGfmSpec', () => {
  test('parses every example with its section and extensions', () => {
    assert.deepEqual(parseGfmSpec(spec), [
      {
        number: 1,
        section: 'First section',
        extensions: ['autolink'],
        startLine: 3,
        endLine: 7,
        markdown: 'foo\tbar',
        html: '<p>foo\tbar</p>',
      },
      {
        number: 2,
        section: 'Task list items (extension)',
        extensions: ['disabled'],
        startLine: 11,
        endLine: 15,
        markdown: '- [ ] foo',
        html: '<ul><li>foo</li></ul>',
      },
    ])
  })

  test('rejects malformed specs', () => {
    assert.throws(() => parseGfmSpec(`${fence} example\nfoo\n`), /has no section/)
    assert.throws(() => parseGfmSpec(`# Section\n${fence} example\nfoo\n`), /Unclosed/)
  })
})

test('fetchLatestGfmExamples resolves and records the latest release', async () => {
  const requestedUrls = []
  const fetchImpl = async url => {
    requestedUrls.push(url)
    if (url.endsWith('/releases/latest')) {
      return { ok: true, json: async () => ({ tag_name: '1.2.3' }) }
    }
    return { ok: true, text: async () => spec }
  }

  const snapshot = await fetchLatestGfmExamples(fetchImpl)

  assert.deepEqual(requestedUrls, [
    'https://api.github.com/repos/github/cmark-gfm/releases/latest',
    'https://raw.githubusercontent.com/github/cmark-gfm/1.2.3/test/spec.txt',
  ])
  assert.equal(snapshot.source.revision, '1.2.3')
  assert.equal(snapshot.source.sha256, createHash('sha256').update(spec).digest('hex'))
  assert.equal(snapshot.examples.length, 2)
})
