import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  PhrasingContentDataNode,
  PhrasingContentMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof TableCell
 */
export const TableCellType = 'TABLE_CELL'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TableCellType = typeof TableCellType


/**
 * TableCell represents a header cell in a Table, if its parent is a head,
 * or a data cell otherwise.
 *
 * @see https://github.com/syntax-tree/mdast#tablecell
 */
export interface TableCell extends
  YastBlockNode<TableCellType>,
  BlockTokenizerParsePhaseState<TableCellType> {
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
  extends BlockTokenizerMatchPhaseState<TableCellType> {
  /**
   * Contents of table cell
   */
  children: [PhrasingContentMatchPhaseState] | []
}
