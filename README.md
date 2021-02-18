
See [Yozora document][yozora-docs] for more details.


# Introduction

This repository aims to create a pluggable parser that parses markdown-like text.


# Parsers

   Name           | Description
  :--------------:|:----------------------
   [parser-gfm][] | parse document in [GFM][] syntax


<!-- Parsers link definitions -->
[parser-gfm]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm#readme

# Tokenizers

## Block

   Name                     | Description
  :------------------------:|:--------------
   [blockquote][]           | A section quoted from somewhere else
   [fenced-code][]          | A sequence of at least three consecutive backtick characters (`) or tildes (~)
   [heading][]              | A heading of a section
   [html-block][]           | Html blocks.
   [indented-code][]        | Composed of one or more indented chunks separated by blank lines
   [link-definition][]      | A link resource
   [list][]                 | A list of items
   [list-item][]            | A list item
   [list-task-item][]       | A todo item
   [paragraph][]            | A sequence of non-blank lines that cannot be interpreted as other kinds of blocks
   [setext-heading][]       |
   [table][]                | Two-dimensional data
   [thematic-break][]       | An thematic break


<!-- Block tokenizers link definitions -->
[blockquote]: https://github.com/guanghechen/yozora/tree/master/tokenizers/blockquote#readme
[fenced-code]: https://github.com/guanghechen/yozora/tree/master/tokenizers/fenced-code#readme
[heading]: https://github.com/guanghechen/yozora/tree/master/tokenizers/heading#readme
[html-block]: https://github.com/guanghechen/yozora/tree/master/tokenizers/html-block#readme
[indented-code]: https://github.com/guanghechen/yozora/tree/master/tokenizers/indented-code#readme
[link-definition]: https://github.com/guanghechen/yozora/tree/master/tokenizers/link-definition#readme
[list]: https://github.com/guanghechen/yozora/tree/master/tokenizers/list#readme
[list-item]: https://github.com/guanghechen/yozora/tree/master/tokenizers/list-item#readme
[list-task-item]: https://github.com/guanghechen/yozora/tree/master/tokenizers/list-task-item#readme
[paragraph]: https://github.com/guanghechen/yozora/tree/master/tokenizers/paragraph#readme
[setext-heading]: https://github.com/guanghechen/yozora/tree/master/tokenizers/setext-heading#readme
[table]: https://github.com/guanghechen/yozora/tree/master/tokenizers/table#readme
[thematic-break]: https://github.com/guanghechen/yozora/tree/master/tokenizers/thematic-break#readme

## Inline

   Name                     | Description
  :------------------------:|:--------------
   [autolink][]             | Absolute URIs and email addresses inside `<` and `>`.
   [autolink-extension][]   | Autolink extension.
   [break][]                | A line break, such as poems or addresses
   [delete][]               | Some contents that are no longer accurate or no longer relevant.
   [emphasis][]             | Some contents are stress emphasized
   [html-inline][]          | Inline raw html.
   [image][]                | An image
   [inline-code][]          | A fragment of computer code, such as a file name, computer program, or anything a computer could parse
   [inline-formula][]       | A fragment of inline formula in latex syntax
   [link][]                 | A hyperlink
   [link-reference][]       | A hyperlink through association, or its original source if there is no association.
   [reference-image][]      | An image through association, or its original source if there is no association
   [text][]                 | Literal contents


<!-- Inline tokenizers link definitions -->
[autolink]: https://github.com/guanghechen/yozora/tree/master/tokenizers/autolink#readme
[autolink-extension]: https://github.com/guanghechen/yozora/tree/master/tokenizers/autolink-extension#readme
[break]: https://github.com/guanghechen/yozora/tree/master/tokenizers/break#readme
[delete]: https://github.com/guanghechen/yozora/tree/master/tokenizers/delete#readme
[emphasis]: https://github.com/guanghechen/yozora/tree/master/tokenizers/emphasis#readme
[html-inline]: https://github.com/guanghechen/yozora/tree/master/tokenizers/html-inline#readme
[image]: https://github.com/guanghechen/yozora/tree/master/tokenizers/image#readme
[inline-code]: https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-code#readme
[inline-formula]: https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-formula#readme
[link]: https://github.com/guanghechen/yozora/tree/master/tokenizers/link#readme
[link-reference]: https://github.com/guanghechen/yozora/tree/master/tokenizers/link-reference#readme
[reference-image]: https://github.com/guanghechen/yozora/tree/master/tokenizers/reference-image#readme
[text]: https://github.com/guanghechen/yozora/tree/master/tokenizers/text#readme



<!-- Other external link definitions -->
[yozora-docs]: https://yozora.guanghechen.com/docs
[GFM]: https://github.github.com/gfm
