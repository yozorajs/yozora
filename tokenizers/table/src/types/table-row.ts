import type { YastNode } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseState,
} from '@yozora/tokenizercore-block'
import type { TableCell, TableCellPostMatchPhaseState } from './table-cell'


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
export interface TableRow extends YastNode<TableRowType> {
  /**
   * Table cells
   */
  children: TableCell[]
}


/**
 * state on match phase of TableRowTokenizer
 */
export type TableRowMatchPhaseState =
  & BlockTokenizerMatchPhaseState<TableRowType>
  & TableRowMatchPhaseStateData


/**
 * state on post-match phase of TableRowTokenizer
 */
export type TableRowPostMatchPhaseState =
  & BlockTokenizerPostMatchPhaseState<TableRowType>
  & TableRowMatchPhaseStateData
  & {
    /**
     * Table cells
     */
    children: TableCellPostMatchPhaseState[]
  }


/**
 * State data of TableRow in match phase of TableRowTokenizer
 */
export interface TableRowMatchPhaseStateData { }
