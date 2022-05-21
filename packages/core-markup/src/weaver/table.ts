import type { AlignType, Table } from '@yozora/ast'
import { TableType } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaveContext, INodeMarkupWeaver } from '../types'
import { createCharacterEscaper } from '../util'

const escapeTableCell: IEscaper = createCharacterEscaper(['|', '\\'])
const calcTableSeparateCell = (align: AlignType, w: number): string => {
  switch (align) {
    case 'center':
      return ':' + '-'.repeat(w - 2) + ':'
    case 'left':
      return ':' + '-'.repeat(w - 1)
    case 'right':
      return '-'.repeat(w - 1) + ':'
    default:
      return '-'.repeat(w)
  }
}

/**
 * Table represents two-dimensional data.
 * TableRow represents a row of cells in a table.
 * TableCell represents a header cell in a Table, if its parent is a head, or a data cell otherwise.
 *
 * @see https://github.github.com/gfm/#tables-extension-
 * @see https://github.com/syntax-tree/mdast#table
 * @see https://github.com/syntax-tree/mdast#tablerow
 * @see https://github.com/syntax-tree/mdast#tablecell
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#table
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#tablerow
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#tablecell
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/table
 */
export class TableMarkupWeaver implements INodeMarkupWeaver<Table> {
  public readonly type = TableType
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = (): boolean => true

  public weave(node: Table, ctx: INodeMarkupWeaveContext): INodeMarkup {
    const tableHead: string[] = node.children[0].children.map(cell =>
      escapeTableCell(ctx.weaveInlineNodes(cell.children)),
    )
    const widths: number[] = tableHead.map(column => column.length)
    const columnCnt: number = node.children[0].children.length

    const tableBody: string[][] = []
    for (let i = 1, rows = node.children; i < rows.length; ++i) {
      const cells = rows[i].children
      const columns: string[] = []
      for (let i = 0; i < columnCnt; ++i) {
        const column: string = escapeTableCell(ctx.weaveInlineNodes(cells[i].children))
        columns[i] = column
        if (widths[i] < column.length) widths[i] = column.length
      }
      tableBody.push(columns)
    }

    for (let i = 0; i < columnCnt; ++i) {
      const w: number = widths[i] | 1
      widths[i] |= w < 3 ? 3 : w
    }

    let content: string
    if (columnCnt === 1) {
      const w: number = widths[0]
      const separateLine: string = '|' + calcTableSeparateCell(node.columns[0].align, w + 2) + '|'
      content =
        '| ' +
        tableHead[0].padEnd(w, ' ') +
        ' |\n' +
        separateLine +
        '\n' +
        tableBody.map(row => '| ' + row[0].padEnd(w, ' ') + ' |').join('\n')
    } else {
      const separateLine: string = node.columns
        .map((col, i) => calcTableSeparateCell(col.align, i > 0 ? widths[i] + 2 : widths[i] + 1))
        .join('|')
      content =
        tableHead
          .map((cell, i) => (i + 1 === columnCnt ? cell : cell.padEnd(widths[i], ' ')))
          .join(' | ') +
        '\n' +
        separateLine +
        '\n' +
        tableBody
          .map(row =>
            row
              .map((cell, i) => (i + 1 === columnCnt ? cell : cell.padEnd(widths[i], ' ')))
              .join(' | '),
          )
          .join('\n')
    }
    return { opener: content, content: '' }
  }
}
