import * as ast from '@yozora/ast'

describe('public exports', function () {
  test('preserves the serialized node discriminants', function () {
    expect(ast).toMatchObject({
      AdmonitionType: 'admonition',
      BlockquoteType: 'blockquote',
      BreakType: 'break',
      CodeType: 'code',
      DefinitionType: 'definition',
      DeleteType: 'delete',
      EcmaImportType: 'ecmaImport',
      EmphasisType: 'emphasis',
      FootnoteDefinitionType: 'footnoteDefinition',
      FootnoteReferenceType: 'footnoteReference',
      FootnoteType: 'footnote',
      FrontmatterType: 'frontmatter',
      HeadingType: 'heading',
      HtmlType: 'html',
      ImageReferenceType: 'imageReference',
      ImageType: 'image',
      InlineCodeType: 'inlineCode',
      InlineMathType: 'inlineMath',
      LinkReferenceType: 'linkReference',
      LinkType: 'link',
      ListItemType: 'listItem',
      ListType: 'list',
      MathType: 'math',
      ParagraphType: 'paragraph',
      RootType: 'root',
      StrongType: 'strong',
      TableCellType: 'tableCell',
      TableRowType: 'tableRow',
      TableType: 'table',
      TextType: 'text',
      ThematicBreakType: 'thematicBreak',
    })
  })

  test('preserves task status values', function () {
    expect(ast.TaskStatus).toEqual({ TODO: 'todo', DOING: 'doing', DONE: 'done' })
  })

  test('preserves HTML content classification values', function () {
    expect(ast.HtmlContentType).toEqual({
      CDATA: 'cdata',
      Closing: 'closing',
      Comment: 'comment',
      Declaration: 'declaration',
      Instruction: 'instruction',
      Open: 'open',
    })
  })
})
