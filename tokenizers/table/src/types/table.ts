import type {
  YastBlockState,
  YastNode,
  YastParent,
} from '@yozora/tokenizercore'
import type { TableRow, TableRowState } from './table-row'


/**
 * typeof Table
 */
export const TableType = 'table'
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
 *      type: 'table',
 *      columns: [
 *        { align: 'left' },
 *        { align: 'center' },
 *      ],
 *      children: [
 *        {
 *          type: 'tableRow',
 *          children: [
 *            {
 *              type: 'tableCell',
 *              children: [{
 *                type : 'phrasingContent',
 *                contents : [{ type : 'text', value: 'foo' }]
 *              }]
 *            },
 *            {
 *              type: 'tableCell',
 *              children: [{
 *                type : 'phrasingContent',
 *                contents : [{ type : 'text', value: 'bar' }]
 *              }]
 *            }
 *          ]
 *        },
 *        {
 *          type: 'tableRow',
 *          children: [
 *            {
 *              type: 'tableCell',
 *              children: [{
 *                type : 'phrasingContent',
 *                contents : [{ type : 'text', value: 'baz' }]
 *              }]
 *            },
 *            {
 *              type: 'tableCell',
 *              children: [{
 *                type : 'phrasingContent',
 *                contents : [{ type : 'text', value: 'qux' }]
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
export interface Table extends YastNode<TableType>, YastParent {
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
 * Middle state during the whole match and parse phase.
 */
export interface TableState extends YastBlockState<TableType> {
  /**
* Table column configuration items
*/
  columns: TableColumn[]
  /**
   * Table rows
   */
  children: TableRowState[]
}
