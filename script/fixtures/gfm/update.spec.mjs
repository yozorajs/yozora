import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { describe, test } from 'node:test'
import { fetchGfmExamples, parseGfmSpecPage } from './update.mjs'

const specPage = `<div class="version">Version 0.29-gfm (2019-04-06)</div>
<h2 id="first-section"><span class="number">1.1</span>First section</h2>
<div class="example" id="example-1">
<div class="examplenum">Example 1</div>
<div class="column"><pre><code class="language-markdown">foo<span class="tab">→</span>&amp;bar
</code></pre></div>
<div class="column"><pre><code class="language-html">&lt;p&gt;foo<span class="tab">→</span>&amp;amp;bar&lt;/p&gt;
</code></pre></div>
</div>
<h2 id="second-section"><span class="number">2.1</span>Second section</h2>
<div class="example" id="example-2">
<div class="examplenum">Example 2</div>
<div class="column"><pre><code class="language-markdown">&lt;em&gt;
</code></pre></div>
<div class="column"><pre><code class="language-html">&lt;p&gt;&lt;em&gt;&lt;/p&gt;
</code></pre></div>
</div>`

describe('parseGfmSpecPage', () => {
  test('parses versioned examples with sections and rendered code text', () => {
    assert.deepEqual(parseGfmSpecPage(specPage), {
      revision: '0.29-gfm',
      publishedAt: '2019-04-06',
      examples: [
        {
          number: 1,
          section: 'First section',
          markdown: 'foo\t&bar',
          html: '<p>foo\t&amp;bar</p>',
        },
        {
          number: 2,
          section: 'Second section',
          markdown: '<em>',
          html: '<p><em></p>',
        },
      ],
    })
  })

  test('rejects malformed or incomplete pages', () => {
    assert.throws(() => parseGfmSpecPage('<main></main>'), /no valid version/)
    assert.throws(
      () => parseGfmSpecPage(specPage.replace('example-1', 'example-2')),
      /Unexpected GFM example number/,
    )
    assert.throws(
      () => parseGfmSpecPage(specPage.replace(/<h2[\s\S]*?<\/h2>/g, '')),
      /has no section/,
    )
    assert.throws(
      () =>
        parseGfmSpecPage(
          `${specPage}\n<div class="example" id="example-3"><code class="language-markdown">incomplete</code></div>`,
        ),
      /Parsed 2 of 3 GFM examples/,
    )
  })
})

test('fetchGfmExamples records the canonical spec page identity', async () => {
  const requestedUrls = []
  const fetchImpl = async (url, options) => {
    requestedUrls.push([url, options.headers.accept])
    return { ok: true, text: async () => specPage }
  }

  const snapshot = await fetchGfmExamples(fetchImpl)

  assert.deepEqual(requestedUrls, [['https://github.github.com/gfm/', 'text/html']])
  assert.deepEqual(snapshot.source, {
    url: 'https://github.github.com/gfm/',
    revision: '0.29-gfm',
    publishedAt: '2019-04-06',
    sha256: createHash('sha256').update(specPage).digest('hex'),
  })
  assert.equal(snapshot.examples.length, 2)
})
