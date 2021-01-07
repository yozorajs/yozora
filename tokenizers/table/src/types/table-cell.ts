import type {
  BlockTokenizerMatchPhaseStateData,
  ClosedBlockTokenizerMatchPhaseState,
  ClosedPhrasingContentMatchPhaseState,
  PhrasingContent,
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
export interface TableCell extends YastBlockNode<TableCellType> {
  /**
   * Contents of table-cell
   */
  children: PhrasingContent[]
}


/**
 * Closed state on match phase of TableCellTokenizer
 */
export type ClosedTableCellMatchPhaseState =
  & ClosedBlockTokenizerMatchPhaseState
  & TableCellMatchPhaseStateData
  & {
    /**
     * Contents of table cell
     */
    children: ClosedPhrasingContentMatchPhaseState[]
  }


/**
 * State data of TableCell in match phase of TableRowTokenizer
 */
export interface TableCellMatchPhaseStateData
  extends BlockTokenizerMatchPhaseStateData<TableCellType> { }
