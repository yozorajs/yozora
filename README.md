# Introduction

This repository aims to create a pluggable parser that parses markdown-like grammar text.


# Tokenizers

   Name                     | Classify  | Description
  :------------------------:|:---------:|:--------------
   [blockquote][]           | Block     | A section quoted from somewhere else
   [delete][]               | Inline    | Some contents that are no longer accurate or no longer relevant.
   [emphasis][]             | Inline    | Some contents are stress emphasized
   [fenced-code][]          | Block     | A sequence of at least three consecutive backtick characters (`) or tildes (~)
   [heading][]              | Block     | A heading of a section
   [image][]                | Inline    | An image
   [indented-code][]        | Block     | Composed of one or more indented chunks separated by blank lines
   [inline-code][]          | Inline    | A fragment of computer code, such as a file name, computer program, or anything a computer could parse
   [inline-formula][]       | Inline    | A fragment of inline formula in latex syntax
   [inline-html-comment][]  | Inline    | Inline html comment
   [line-break][]           | Inline    | A line break, such as poems or addresses
   [link][]                 | Inline    | A hyperlink
   [link-definition][]      | Block     | A link resource
   [list][]                 | Block     | A list of items
   [list-bullet-item][]     | Block     | A unordered list item
   [list-ordered-item][]    | Block     | A ordered list item
   [list-task-item][]       | Block     | A todo item
   [paragraph][]            | Block     | A sequence of non-blank lines that cannot be interpreted as other kinds of blocks
   [reference-image][]      | Inline    | An image through association, or its original source if there is no association
   [reference-link][]       | Inline    | A hyperlink through association, or its original source if there is no association.
   [setext-heading][]       | Block     |
   [table][]                | Block     | Two-dimensional data
   [text][]                 | Inline    | Literal contents
   [thematic-break][]       | Block     | An thematic break


# Parsers

   Name           | Description
  :--------------:|:----------------------
   [parser-gfm][] | parse document in [GFM][] syntax


<!-- tokenizers link definitions -->
[blockquote]: https://github.com/guanghechen/yozora/tree/master/tokenizers/blockquote#readme
[delete]: https://github.com/guanghechen/yozora/tree/master/tokenizers/delete#readme
[emphasis]: https://github.com/guanghechen/yozora/tree/master/tokenizers/emphasis#readme
[fenced-code]: https://github.com/guanghechen/yozora/tree/master/tokenizers/fenced-code#readme
[heading]: https://github.com/guanghechen/yozora/tree/master/tokenizers/heading#readme
[image]: https://github.com/guanghechen/yozora/tree/master/tokenizers/image#readme
[indented-code]: https://github.com/guanghechen/yozora/tree/master/tokenizers/indented-code#readme
[inline-code]: https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-code#readme
[inline-formula]: https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-formula#readme
[inline-html-comment]: https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-html-comment#readme
[line-break]: https://github.com/guanghechen/yozora/tree/master/tokenizers/line-break#readme
[link]: https://github.com/guanghechen/yozora/tree/master/tokenizers/link#readme
[link-definition]: https://github.com/guanghechen/yozora/tree/master/tokenizers/link-definition#readme
[list]: https://github.com/guanghechen/yozora/tree/master/tokenizers/list#readme
[list-bullet-item]: https://github.com/guanghechen/yozora/tree/master/tokenizers/list-bullet-item#readme
[list-ordered-item]: https://github.com/guanghechen/yozora/tree/master/tokenizers/list-ordered-item#readme
[list-task-item]: https://github.com/guanghechen/yozora/tree/master/tokenizers/list-task-item#readme
[paragraph]: https://github.com/guanghechen/yozora/tree/master/tokenizers/paragraph#readme
[reference-image]: https://github.com/guanghechen/yozora/tree/master/tokenizers/reference-image#readme
[reference-link]: https://github.com/guanghechen/yozora/tree/master/tokenizers/reference-link#readme
[setext-heading]: https://github.com/guanghechen/yozora/tree/master/tokenizers/setext-heading#readme
[table]: https://github.com/guanghechen/yozora/tree/master/tokenizers/table#readme
[text]: https://github.com/guanghechen/yozora/tree/master/tokenizers/text#readme
[thematic-break]: https://github.com/guanghechen/yozora/tree/master/tokenizers/thematic-break#readme


<!-- Parsers link definitions -->
[parser-gfm]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm#readme


<!-- Other external link definitions -->
[GFM]: https://github.github.com/gfm
