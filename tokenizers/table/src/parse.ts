import type { ITableCell, ITableRow, IYastNode } from '@yozora/ast'
import { TableCellType, TableRowType, TableType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type { IParseBlockHookCreator, IPhrasingContent } from '@yozora/core-tokenizer'
import { PhrasingContentType } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = api => ({
  parse: tokens =>
    tokens.map(token => {
      const tableRows: ITableRow[] = token.rows.map((row): ITableRow => {
        const tableCells: ITableCell[] = row.cells.map((cell): ITableCell => {
          /**
           * Include a pipe in a cell’s content by escaping it, including inside
           * other inline spans
           * @see https://github.github.com/gfm/#example-200
           */
          const contents: IYastNode[] = api.parseBlockTokens(cell.contents)
          for (const phrasingContent of contents as IPhrasingContent[]) {
            if (phrasingContent.type !== PhrasingContentType) continue
            const nextContents: INodePoint[] = []
            const endIndex = phrasingContent.contents.length
            for (let i = 0; i < endIndex; ++i) {
              const p = phrasingContent.contents[i]
              if (p.codePoint === AsciiCodePoint.BACKSLASH && i + 1 < endIndex) {
                const q = phrasingContent.contents[i + 1]
                if (q.codePoint !== AsciiCodePoint.VERTICAL_SLASH) nextContents.push(p)
                nextContents.push(q)
                i += 1
                continue
              }
              nextContents.push(p)
            }
            phrasingContent.contents = nextContents
          }

          const tableCell: ITableCell = api.shouldReservePosition
            ? { type: TableCellType, position: cell.position, children: contents }
            : { type: TableCellType, children: contents }
          return tableCell
        })

        const tableRow: ITableRow = api.shouldReservePosition
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
