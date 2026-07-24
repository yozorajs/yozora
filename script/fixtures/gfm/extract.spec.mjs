import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { parseGFMExample } from './extract.mjs'

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
