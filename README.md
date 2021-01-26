# Introduction

This repository aims to create a pluggable parser that parses markdown-like grammar text.


# Parsers

   Name           | Description
  :--------------:|:----------------------
   [parser-gfm][] | parse document in [GFM][] syntax


<!-- Parsers link definitions -->
[parser-gfm]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm#readme

# Tokenizers

## Block

   Name                     | Classify  | Description
  :------------------------:|:---------:|:--------------
   [blockquote][]           | Block     | A section quoted from somewhere else
   [fenced-code][]          | Block     | A sequence of at least three consecutive backtick characters (`) or tildes (~)
   [heading][]              | Block     | A heading of a section
   [html-block][]           | Block     | Html blocks.
   [indented-code][]        | Block     | Composed of one or more indented chunks separated by blank lines
   [link-definition][]      | Block     | A link resource
   [list][]                 | Block     | A list of items
   [list-item][]            | Block     | A list item
   [list-task-item][]       | Block     | A todo item
   [paragraph][]            | Block     | A sequence of non-blank lines that cannot be interpreted as other kinds of blocks
   [setext-heading][]       | Block     |
   [table][]                | Block     | Two-dimensional data
   [thematic-break][]       | Block     | An thematic break


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

   Name                     | Classify  | Description
  :------------------------:|:---------:|:--------------
   [autolink][]             | Inline    | Absolute URIs and email addresses inside `<` and `>`.
   [delete][]               | Inline    | Some contents that are no longer accurate or no longer relevant.
   [emphasis][]             | Inline    | Some contents are stress emphasized
   [html-inline][]          | Inline    | Inline raw html.
   [image][]                | Inline    | An image
   [inline-code][]          | Inline    | A fragment of computer code, such as a file name, computer program, or anything a computer could parse
   [inline-formula][]       | Inline    | A fragment of inline formula in latex syntax
   [line-break][]           | Inline    | A line break, such as poems or addresses
   [link][]                 | Inline    | A hyperlink
   [reference-image][]      | Inline    | An image through association, or its original source if there is no association
   [reference-link][]       | Inline    | A hyperlink through association, or its original source if there is no association.
   [text][]                 | Inline    | Literal contents


<!-- Inline tokenizers link definitions -->
[autolink]: https://github.com/guanghechen/yozora/tree/master/tokenizers/autolink#readme
[delete]: https://github.com/guanghechen/yozora/tree/master/tokenizers/delete#readme
[emphasis]: https://github.com/guanghechen/yozora/tree/master/tokenizers/emphasis#readme
[html-inline]: https://github.com/guanghechen/yozora/tree/master/tokenizers/html-inline#readme
[image]: https://github.com/guanghechen/yozora/tree/master/tokenizers/image#readme
[inline-code]: https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-code#readme
[inline-formula]: https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-formula#readme
[line-break]: https://github.com/guanghechen/yozora/tree/master/tokenizers/line-break#readme
[link]: https://github.com/guanghechen/yozora/tree/master/tokenizers/link#readme
[reference-image]: https://github.com/guanghechen/yozora/tree/master/tokenizers/reference-image#readme
[reference-link]: https://github.com/guanghechen/yozora/tree/master/tokenizers/reference-link#readme
[text]: https://github.com/guanghechen/yozora/tree/master/tokenizers/text#readme



<!-- Other external link definitions -->
[GFM]: https://github.github.com/gfm
