import {
  BlockDataNode,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
} from '@yozora/tokenizercore-block'
import { TableRowDataNode, TableRowMatchPhaseState } from './table-row'


/**
 * typeof TableDataNode
 */
export const TableDataNodeType = 'TABLE'
export type TableDataNodeType = typeof TableDataNodeType


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
export interface TableDataNode extends
  BlockDataNode<TableDataNodeType>,
  BlockTokenizerParsePhaseState<TableDataNodeType> {
  /**
   * Table column configuration items
   */
  columns: TableColumn[]
  /**
   * Table rows (include table headers)
   */
  children: TableRowDataNode[]
}


/**
 * State of Table in match phase of TableTokenizer
 */
export interface TableMatchPhaseState
  extends BlockTokenizerMatchPhaseState<TableDataNodeType> {
  /**
   * Table column configuration items
   */
  columns: TableColumn[]
  /**
   * Table rows
   */
  children: TableRowMatchPhaseState[]
}
