import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'
import type { TableCell, TableCellMatchPhaseState } from './table-cell'


/**
 * typeof TableRow
 */
export const TableRowType = 'TABLE_ROW'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TableRowType = typeof TableRowType


/**
 * TableRow represents a row of cells in a table.
 *
 * @see https://github.com/syntax-tree/mdast#tablerow
 */
export interface TableRow extends
  YastBlockNode<TableRowType>,
  BlockTokenizerParsePhaseState<TableRowType> {
  /**
   * Table cells
   */
  children: TableCell[]
}


/**
 * State of TableRow in match phase of TableTokenizer
 */
export interface TableRowMatchPhaseState
  extends BlockTokenizerMatchPhaseState<TableRowType> {
  /**
   * Table cells
   */
  children: TableCellMatchPhaseState[]
}
