import type {
  BlockTokenizerMatchPhaseStateData,
  ClosedBlockTokenizerMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'
import type { ClosedTableRowMatchPhaseState, TableRow } from './table-row'


/**
 * typeof Table
 */
export const TableType = 'TABLE'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TableType = typeof TableType


/**
 * alignType represents how phrasing content is aligned
 * @see https://github.com/syntax-tree/mdast#aligntype
 */
export type TableAlignType = 'left' | 'right' | 'center' | null


export interface TableColumn {
  /**
   * An align field can be present. If present, it must be a list of alignTypes.
   * It represents how cells in columns are aligned.
   */
  align: TableAlignType
}


/**
 *
 * @example
 *    ````markdown
 *    | foo | bar |
 *    | :-- | :-: |
 *    | baz | qux |
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'TABLE',
 *      columns: [
 *        { align: 'left' },
 *        { align: 'center' },
 *      ],
 *      children: [
 *        {
 *          type: 'TABLE_ROW',
 *          children: [
 *            {
 *              type: 'TABLE_CELL',
 *              children: [{
 *                type : 'PHRASING_CONTENT',
 *                contents : [{ type : 'TEXT', value: 'foo' }]
 *              }]
 *            },
 *            {
 *              type: 'TABLE_CELL',
 *              children: [{
 *                type : 'PHRASING_CONTENT',
 *                contents : [{ type : 'TEXT', value: 'bar' }]
 *              }]
 *            }
 *          ]
 *        },
 *        {
 *          type: 'TABLE_ROW',
 *          children: [
 *            {
 *              type: 'TABLE_CELL',
 *              children: [{
 *                type : 'PHRASING_CONTENT',
 *                contents : [{ type : 'TEXT', value: 'baz' }]
 *              }]
 *            },
 *            {
 *              type: 'TABLE_CELL',
 *              children: [{
 *                type : 'PHRASING_CONTENT',
 *                contents : [{ type : 'TEXT', value: 'qux' }]
 *              }]
 *            }
 *          ]
 *        }
 *      ]
 *    }
 *    ```
 * @see https://github.github.com/gfm/#table
 * @see https://github.com/syntax-tree/mdast#table
 */
export interface Table extends YastBlockNode<TableType> {
  /**
   * Table column configuration items
   */
  columns: TableColumn[]
  /**
   * Table rows (include table headers)
   */
  children: TableRow[]
}


/**
 * Closed state on match phase of TableTokenizer
 */
export type ClosedTableMatchPhaseState =
  & ClosedBlockTokenizerMatchPhaseState
  & TableMatchPhaseStateData
  & {
    /**
     * Table rows
     */
    children: ClosedTableRowMatchPhaseState[]
  }


/**
 * State data of Table in match phase of TableTokenizer
 */
export interface TableMatchPhaseStateData
  extends BlockTokenizerMatchPhaseStateData<TableType> {
  /**
   * Table column configuration items
   */
  columns: TableColumn[]
}
