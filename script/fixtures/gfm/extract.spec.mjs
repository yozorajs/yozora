import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { parseGFMDocument, parseGFMExample } from './extract.mjs'

test('parses a complete GFM document without a browser', () => {
  const html = `
    <div class="version">Version test</div>
    <p>Shared <em>description</em>:</p>
    <div class="example" id="example-1">
      <div class="column"><pre><code class="language-markdown">→&lt;x&gt;<span class="space"> </span>&amp;copy;
</code></pre></div>
      <div class="column"><pre><code class="language-html">&lt;p&gt;&#x3b1;&lt;/p&gt;
</code></pre></div>
    </div>
    <div class="example" id="example-2">
      <div class="column"><pre><code class="language-markdown">second
</code></pre></div>
      <div class="column"><pre><code class="language-html">&lt;p&gt;second&lt;/p&gt;
</code></pre></div>
    </div>
  `

  assert.deepEqual(parseGFMDocument(html), {
    version: 'Version test',
    examples: [
      null,
      {
        title: 'GFM#1 https://github.github.com/gfm/#example-1',
        description: 'Shared description',
        content: '\t<x> &copy;',
        expectedHtml: '<p>α</p>',
      },
      {
        title: 'GFM#2 https://github.github.com/gfm/#example-2',
        description: 'Shared description',
        content: 'second',
        expectedHtml: '<p>second</p>',
      },
    ],
  })
})

test('rejects non-contiguous document examples', () => {
  const html = `
    <div class="version">Version test</div>
    <div class="example" id="example-2"></div>
  `
  assert.throws(() => parseGFMDocument(html), /Non-contiguous GFM example 2/)
})

describe('parseGFMExample', () => {
  test('parses a valid example id', () => {
    const originalWindow = globalThis.window
    globalThis.window = {
      location: {
        origin: 'https://github.github.com',
        pathname: '/gfm/',
      },
    }

    const columns = ['foo→bar\n', '<p>foo→bar</p>\n'].map(innerText => ({
      getElementsByTagName: () => [{ innerText }],
    }))
    const exampleEl = {
      id: 'example-42',
      previousElementSibling: null,
      getElementsByClassName: () => columns,
    }

    try {
      assert.deepEqual(parseGFMExample(exampleEl), {
        title: 'GFM#42 https://github.github.com/gfm/#example-42',
        description: undefined,
        content: 'foo\tbar',
        expectedHtml: '<p>foo\tbar</p>',
      })
    } finally {
      if (originalWindow === undefined) delete globalThis.window
      else globalThis.window = originalWindow
    }
  })

  test('rejects malformed example ids', () => {
    const originalError = console.error
    console.error = () => {}

    try {
      for (const id of ['', 'example-', 'example-1-extra', 'prefix-example-1']) {
        assert.equal(parseGFMExample({ id }), null, `should reject ${JSON.stringify(id)}`)
      }
    } finally {
      console.error = originalError
    }
  })
})
