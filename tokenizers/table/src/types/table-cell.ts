import type { YastNode } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseState,
  PhrasingContent,
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
 * State on match phase of TableCellTokenizer
 */
export type TableCellMatchPhaseState =
  & BlockTokenizerMatchPhaseState<TableCellType>
  & TableCellMatchPhaseStateData


/**
 * State on post-match phase of TableCellTokenizer
 */
export type TableCellPostMatchPhaseState =
  & BlockTokenizerPostMatchPhaseState<TableCellType>
  & TableCellMatchPhaseStateData
  & {
    /**
     * Contents of table cell
     */
    children: BlockTokenizerPostMatchPhaseState[]
  }


/**
 * State data of TableCell in match phase of TableRowTokenizer
 */
export interface TableCellMatchPhaseStateData { }
