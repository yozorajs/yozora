import path from 'path'
import { renderMarkdown } from './util'

interface HandlebarData {
  packageName?: string
  packageDirectory?: string
  tokenizerName: string
  tokenizerPriority: string
  inGfm?: boolean
  inGfmEx?: boolean
  isInlineTokenizer: boolean
  isBlockTokenizer: boolean
  usageDemoSourceContent: string
}

const items: HandlebarData[] = [
  // admonition
  {
    tokenizerName: 'admonition',
    tokenizerPriority: 'TokenizerPriority.FENCED_BLOCK',
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
:::info this is a info type admonition
waw

### some block contents
:::
\``,
  },
  // autolink
  {
    tokenizerName: 'autolink',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: `\`
<foo@bar.example.com>

<http://foo.bar.baz>

<made-up-scheme://foo,bar>
\``,
  },
  // autolink-extension
  {
    tokenizerName: 'autolink-extension',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: false,
    inGfmEx: true,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: `\`
foo@bar.example.com

http://foo.bar.baz

made-up-scheme://foo,bar
\``,
  },
  // blockquote
  {
    tokenizerName: 'blockquote',
    tokenizerPriority: 'TokenizerPriority.CONTAINING_BLOCK',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
> This is blockquote
> - with some list contents
> - apple
>
> ## A cat in heading
\``,
  },
  // break
  {
    tokenizerName: 'break',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: `\`
foo
baz

foo\\
baz

foo
baz
\``,
  },
  // definition
  {
    tokenizerName: 'definition',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
[foo]: /url '
title
line1
line2
'

[foo]
\``,
  },
  // delete
  {
    tokenizerName: 'delete',
    tokenizerPriority: 'TokenizerPriority.CONTAINING_INLINE',
    inGfm: false,
    inGfmEx: true,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: `\`
This ~~has a

new paragraph~~.
\``,
  },
  // emphasis
  {
    tokenizerName: 'emphasis',
    tokenizerPriority: 'TokenizerPriority.CONTAINING_INLINE',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: `\`

**foo bar**

__foo bar__

_foo bar_

*foo bar*

__**__foo__**__

\``,
  },
  // fenced-block
  {
    tokenizerName: 'fenced-block',
    tokenizerPriority: 'TokenizerPriority.FENCED_BLOCK',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `"source contents"`,
  },
  // fenced-code
  {
    tokenizerName: 'fenced-code',
    tokenizerPriority: 'TokenizerPriority.FENCED_BLOCK',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
\\\`\\\`\\\`ruby
def foo(x)
  return 3
end
\\\`\\\`\\\`

~~~typescript
export const foo: string = 'waw'
~~~
# baz
\``,
  },
  // footnote
  {
    tokenizerName: 'footnote',
    tokenizerPriority: 'TokenizerPriority.LINKS',
    inGfm: false,
    inGfmEx: false,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: `\`
^[inline footnote]

^[footnote with *emphasis* and $x^2+y^2$ and \`inline code\`]
\``,
  },
  // footnote-definition
  {
    tokenizerName: 'footnote-definition',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: false,
    inGfmEx: false,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
Here is a footnote reference,[^1]
another,[^long note],

[^big footnote]: Here's one with multiple paragraphs and code.

    Indent paragraphs to include them in the footnote.

    \\\`\\\`\\\`
    Fenced coding
    \\\`\\\`\\\`

    ## heading

    Add as many paragraphs as you like.
\``,
  },
  // footnote-reference
  {
    tokenizerName: 'footnote-reference',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: false,
    inGfmEx: false,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: `\`
Here is a footnote reference,[^1]
another,[^long note],

[^big footnote]: Here's one with multiple paragraphs and code.

    Indent paragraphs to include them in the footnote.

    \\\`\\\`\\\`
    Fenced coding
    \\\`\\\`\\\`

    ## heading

    Add as many paragraphs as you like.
\``,
  },
  // heading
  {
    tokenizerName: 'heading',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
# h1
## h2
### h3
#### h4
##### h5
###### h6
\``,
  },
  // html-block
  {
    tokenizerName: 'html-block',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
<pre language="haskell"><code>
import Text.HTML.TagSoup

main :: IO ()
main = print $ parseTags tags
</code></pre>
okay
\``,
  },
  // html-inline
  {
    tokenizerName: 'html-inline',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: `\`
<a><bab><c2c>

foo <?php echo $a; ?>
\``,
  },
  // image
  {
    tokenizerName: 'image',
    tokenizerPriority: 'TokenizerPriority.LINKS',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: `\`
![foo](/url "title")
\``,
  },
  // image-reference
  {
    tokenizerName: 'image-reference',
    tokenizerPriority: 'TokenizerPriority.LINKS',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: `\`
![foo][]

[foo]: /url "title"
\``,
  },
  // indented-code
  {
    tokenizerName: 'indented-code',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
    <a/>
    *hi*

    - one
\``,
  },
  // inline-code
  {
    tokenizerName: 'inline-code',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: '"`inline code`"',
  },
  // inline-math
  {
    tokenizerName: 'inline-math',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: false,
    inGfmEx: false,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: '"`$x^2 + y^2 = z^2, x < 0$`"',
  },
  // link
  {
    tokenizerName: 'link',
    tokenizerPriority: 'TokenizerPriority.LINKS',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: `\`
[link](/uri "title")
[link](/uri)
\``,
  },
  // link-reference
  {
    tokenizerName: 'link-reference',
    tokenizerPriority: 'TokenizerPriority.LINKS',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: `\`
[foo][bar]

[bar]: /url "title"
\``,
  },
  // list
  {
    tokenizerName: 'list',
    tokenizerPriority: 'TokenizerPriority.CONTAINING_BLOCK',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
- a
- b
  - c
  - d
  - e
- f
- g
\``,
  },
  // list-item
  {
    tokenizerName: 'list-item',
    tokenizerPriority: 'TokenizerPriority.CONTAINING_BLOCK',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
- a
- b
  - c
  - d
  - e
- f
- g
\``,
  },
  // math
  {
    tokenizerName: 'math',
    tokenizerPriority: 'TokenizerPriority.FENCED_BLOCK',
    inGfm: false,
    inGfmEx: false,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
$$x^2 + y^2=z^2$$

$$
f(x)=\\left\\lbrace\\begin{aligned}
&x^2, &x < 0\\\\
&0, &x = 0\\\\
&x^3, &x > 0
\\end{aligned}\\right.
$$
\``,
  },
  // paragraph
  {
    tokenizerName: 'paragraph',
    tokenizerPriority: 'TokenizerPriority.FALLBACK',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
aaa

bbb
\``,
  },
  // setext-heading
  {
    tokenizerName: 'setext-heading',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
Foo *bar*
=========

Foo *bar*
---------
\``,
  },
  // table
  {
    tokenizerName: 'table',
    tokenizerPriority: 'TokenizerPriority.INTERRUPTABLE_BLOCK',
    inGfm: false,
    inGfmEx: true,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
| foo | bar |
| --- | --- |
| baz | bim |
\``,
  },
  // text
  {
    tokenizerName: 'text',
    tokenizerPriority: 'TokenizerPriority.FALLBACK',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: true,
    isBlockTokenizer: false,
    usageDemoSourceContent: `"hello $.;'there"`,
  },
  // thematic-break
  {
    tokenizerName: 'thematic-break',
    tokenizerPriority: 'TokenizerPriority.ATOMIC',
    inGfm: true,
    inGfmEx: true,
    isInlineTokenizer: false,
    isBlockTokenizer: true,
    usageDemoSourceContent: `\`
***
---
___
\``,
  },
]

// Perform replace
items.forEach((item): void => {
  const data = item
  data.packageDirectory ??= 'tokenizers/' + data.tokenizerName
  const docFilepath = path.join(
    __dirname,
    '../../',
    data.packageDirectory,
    'README.md',
  )
  data.packageName ??= `@yozora/tokenizer-${data.tokenizerName}`
  data.inGfm ??= false
  data.inGfmEx ??= false
  renderMarkdown<HandlebarData>(docFilepath, data)
})
