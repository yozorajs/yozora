import type { YastParent } from '@yozora/ast'
import type { PhrasingContent, YastBlockState } from '@yozora/core-tokenizer'

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
export interface TableCell extends YastParent<TableCellType> {
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
