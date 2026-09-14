# Fixture answers

Each case shares one `input` and groups its expected representations under `answer`:

```json
{
  "answer": {
    "gfm": {
      "html": "<p>content</p>",
      "markup": "content",
      "ast": {
        "type": "root",
        "children": [
          {
            "type": "paragraph",
            "children": [
              { "type": "text", "value": "content" }
            ]
          }
        ]
      }
    },
    "gfm-ex": {
      "html": "<p class=\"extended\">content</p>"
    },
    "yozora": {
      "markup": "content\n"
    }
  }
}
```

`html`, `markup`, and `ast` inherit independently. A partial parser answer does not replace the
entire answer inherited from an earlier parser:

- `gfm` reads its own fields.
- `gfm-ex` falls back to `gfm` for each missing field.
- `yozora` falls back to `gfm-ex`, then `gfm`, for each missing field.

An empty string is an explicit answer. Source-only fixtures can omit `ast` and `markup`; a test
requiring an unavailable representation fails with the fixture path.

Test helpers take the parser name explicitly:

```typescript
createTokenizerTester('yozora', parser)
createTokenizerTesters(['gfm', gfmParser], ['gfm-ex', gfmExParser], ['yozora', yozoraParser])
createMarkupTester('yozora', parser, weaver)
```

`runAnswer()` updates only the selected representation in the selected parser's answer. It
preserves the other fields and parser answers, and does not materialize inherited values into
an override. AST objects remain expanded when files are generated; unchanged synchronized
fixtures retain their original formatting.

The [GFM synchronization workflow](../script/fixtures/gfm/README.md) updates `answer.gfm.html`
from the upstream specification and preserves the other expected answers by exact input.
