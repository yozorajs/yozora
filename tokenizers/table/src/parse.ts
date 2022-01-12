import type { IYastNode, TableCell, TableRow } from '@yozora/ast'
import { TableCellType, TableRowType, TableType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import { mergeAndStripContentLines } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = api => ({
  parse: tokens =>
    tokens.map(token => {
      const tableRows: TableRow[] = token.rows.map((row): TableRow => {
        const tableCells: TableCell[] = row.cells.map((cell): TableCell => {
          /**
           * Include a pipe in a cell’s content by escaping it, including inside
           * other inline spans
           * @see https://github.github.com/gfm/#example-200
           */
          const contents: INodePoint[] = []
          {
            const nodePoints: INodePoint[] = mergeAndStripContentLines(cell.lines)
            for (let i = 0, endIndex = nodePoints.length; i < endIndex; ++i) {
              const p = nodePoints[i]
              if (p.codePoint === AsciiCodePoint.BACKSLASH && i + 1 < endIndex) {
                const q: INodePoint = nodePoints[i + 1]
                if (q.codePoint !== AsciiCodePoint.VERTICAL_SLASH) contents.push(p)
                contents.push(q)
                i += 1
              } else {
                contents.push(p)
              }
            }
          }

          const children: IYastNode[] = api.processInlines(contents)
          const tableCell: TableCell = api.shouldReservePosition
            ? { type: TableCellType, position: cell.position, children }
            : { type: TableCellType, children }
          return tableCell
        })

        const tableRow: TableRow = api.shouldReservePosition
          ? { type: TableRowType, position: row.position, children: tableCells }
          : { type: TableRowType, children: tableCells }
        return tableRow
      })

      const table: INode = api.shouldReservePosition
        ? { type: TableType, position: token.position, columns: token.columns, children: tableRows }
        : { type: TableType, columns: token.columns, children: tableRows }
      return table
    }),
})
