import type { YastBlockState, YastParent } from '@yozora/core-tokenizer'
import type { TableCell, TableCellState } from './table-cell'

/**
 * typeof TableRow
 */
export const TableRowType = 'tableRow'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TableRowType = typeof TableRowType

/**
 * TableRow represents a row of cells in a table.
 *
 * @see https://github.com/syntax-tree/mdast#tablerow
 */
export interface TableRow extends YastParent<TableRowType> {
  /**
   * Table cells
   */
  children: TableCell[]
}

/**
 * Middle state during the whole match and parse phase.
 */
export interface TableRowState extends YastBlockState<TableRowType> {
  /**
   * Table cells
   */
  children: TableCellState[]
}
