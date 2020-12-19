import type {
  BlockDataNode,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
} from '@yozora/tokenizercore-block'
import type { TableCellDataNode, TableCellMatchPhaseState } from './table-cell'


/**
 * typeof TableCellDataNode
 */
export const TableRowDataNodeType = 'TABLE_ROW'
export type TableRowDataNodeType = typeof TableRowDataNodeType


/**
 * TableRow represents a row of cells in a table.
 *
 * @see https://github.com/syntax-tree/mdast#tablerow
 */
export interface TableRowDataNode extends
  BlockDataNode<TableRowDataNodeType>,
  BlockTokenizerParsePhaseState<TableRowDataNodeType> {
  /**
   * Table cells
   */
  children: TableCellDataNode[]
}


/**
 * State of TableRow in match phase of TableTokenizer
 */
export interface TableRowMatchPhaseState
  extends BlockTokenizerMatchPhaseState<TableRowDataNodeType> {
  /**
   * Table cells
   */
  children: TableCellMatchPhaseState[]
}
