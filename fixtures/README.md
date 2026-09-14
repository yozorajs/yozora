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

All three default parser suites scan every shared JSON fixture, using each parser's built-in
tokenizers. AST expectations belong to the corresponding parser; overrides are only needed when
they differ from the inherited AST. Source-only cases must receive AST expectations and move from
`gfm-new` to `gfm`, with their grouping updated, before these suites pass.

Test helpers take the parser name explicitly:

```typescript
createTokenizerTester('yozora', parser)
createTokenizerTesters(['gfm', gfmParser], ['gfm-ex', gfmExParser], ['yozora', yozoraParser])
createMarkupTester('yozora', parser, weaver)
```

The parser name selects the expected syntax profile. Tokenizer tests that enable an extension on
another parser select the profile matching that extension; for example, a GFM parser with the
delete tokenizer uses the `gfm-ex` expectations.

`runAnswer()` updates only the selected representation in the selected parser's answer. It
preserves the other fields and parser answers, and does not materialize inherited values into
an override. AST objects remain expanded when files are generated; unchanged synchronized
fixtures retain their original formatting.

The [GFM synchronization workflow](../script/fixtures/gfm/README.md) updates `answer.gfm.html`
from the upstream specification and preserves the other expected answers by exact input.
