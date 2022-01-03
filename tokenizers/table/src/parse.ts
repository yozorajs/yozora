import type { ITableCell, ITableRow } from '@yozora/ast'
import { TableCellType, TableRowType, TableType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type { IParseBlockHookCreator, IPhrasingContent } from '@yozora/core-tokenizer'
import { PhrasingContentType } from '@yozora/core-tokenizer'
import type { IHookContext, INode, ITableToken, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = () => ({
  parse: (token, children) => {
    let node: INode
    switch (token.nodeType) {
      case TableType: {
        node = {
          type: TableType,
          columns: (token as ITableToken).columns,
          children: children as ITableRow[],
        }
        break
      }
      case TableRowType: {
        node = {
          type: TableRowType,
          children: children as ITableCell[],
        }
        break
      }
      case TableCellType: {
        node = {
          type: TableCellType,
          children: children as IPhrasingContent[],
        }

        /**
         * Include a pipe in a cell’s content by escaping it, including inside
         * other inline spans
         * @see https://github.github.com/gfm/#example-200
         */
        for (const phrasingContent of node.children as IPhrasingContent[]) {
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
        break
      }
      default:
        return null
    }
    return node
  },
})
