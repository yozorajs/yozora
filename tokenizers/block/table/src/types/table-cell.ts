import {
  BlockDataNode,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  PhrasingContentDataNode,
  PhrasingContentMatchPhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof TableCellDataNode
 */
export const TableCellDataNodeType = 'TABLE_CELL'
export type TableCellDataNodeType = typeof TableCellDataNodeType


/**
 * TableCell represents a header cell in a Table, if its parent is a head,
 * or a data cell otherwise.
 *
 * @see https://github.com/syntax-tree/mdast#tablecell
 */
export interface TableCellDataNode extends
  BlockDataNode<TableCellDataNodeType>,
  BlockTokenizerParsePhaseState<TableCellDataNodeType> {
  /**
   * 单元格内容
   * Contents of table-cell
   */
  children: [PhrasingContentDataNode]
}


/**
 * State of TableCell in match phase of TableTokenizer
 */
export interface TableCellMatchPhaseState
  extends BlockTokenizerMatchPhaseState<TableCellDataNodeType> {
  /**
   * Contents of table cell
   */
  children: [PhrasingContentMatchPhaseState] | []
}
