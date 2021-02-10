import type { YastNode } from '@yozora/tokenizercore'
import type {
  PhrasingContent,
  YastBlockState,
} from '@yozora/tokenizercore-block'


/**
 * typeof TableCell
 */
export const TableCellType = 'tableCell'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TableCellType = typeof TableCellType


/**
 * TableCell represents a header cell in a Table, if its parent is a head,
 * or a data cell otherwise.
 *
 * @see https://github.com/syntax-tree/mdast#tablecell
 */
export interface TableCell extends YastNode<TableCellType> {
  /**
   * Contents of table-cell
   */
  children: PhrasingContent[]
}


/**
 * Middle state during the whole match and parse phase.
 */
export interface TableCellState extends YastBlockState<TableCellType> {
  /**
   * Contents of table cell
   */
  children: YastBlockState[]
}
