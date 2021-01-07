import type {
  BlockTokenizerMatchPhaseStateData,
  ClosedBlockTokenizerMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'
import type { ClosedTableCellMatchPhaseState, TableCell } from './table-cell'


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
export interface TableRow extends YastBlockNode<TableRowType> {
  /**
   * Table cells
   */
  children: TableCell[]
}


/**
 * Closed state on match phase of TableRowTokenizer
 */
export type ClosedTableRowMatchPhaseState =
  & ClosedBlockTokenizerMatchPhaseState
  & TableRowMatchPhaseStateData
  & {
    /**
     * Table cells
     */
    children: ClosedTableCellMatchPhaseState[]
  }


/**
 * State data of TableRow in match phase of TableRowTokenizer
 */
export interface TableRowMatchPhaseStateData
  extends BlockTokenizerMatchPhaseStateData<TableRowType> { }
