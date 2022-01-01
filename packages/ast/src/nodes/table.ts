import type { IYastAlignType, IYastParent } from '../ast'
import type { ITableRow } from './table-row'

export const TableType = 'table'
export type TableType = typeof TableType

/**
 * Table column configs.
 */
export interface ITableColumn {
  /**
   * An align field can be present. If present, it must be a list of alignTypes.
   * It represents how cells in columns are aligned.
   */
  align: IYastAlignType
}

/**
 * @see https://github.github.com/gfm/#table
 * @see https://github.com/syntax-tree/mdast#table
 */
export interface ITable extends IYastParent<TableType> {
  /**
   * Table column configuration items
   */
  columns: ITableColumn[]
  /**
   * Table rows (include table headers)
   */
  children: ITableRow[]
}

/**
 * Example:
 *
 *    ```markdown
 *    foo | bar
 *    :--:|:----
 *    baz | qux
 *    ```
 *
 * Yields:
 *
 *    ```json
 *    [
 *      {
 *        "type": "table",
 *        "columns": [
 *          {
 *            "align": "center"
 *          },
 *          {
 *            "align": "left"
 *          }
 *        ],
 *        "children": [
 *          {
 *            "type": "tableRow",
 *            "children": [
 *              {
 *                "type": "tableCell",
 *                "children": [
 *                  {
 *                    "type": "text",
 *                    "value": "foo"
 *                  }
 *                ]
 *              },
 *              {
 *                "type": "tableCell",
 *                "children": [
 *                  {
 *                    "type": "text",
 *                    "value": "bar"
 *                  }
 *                ]
 *              }
 *            ]
 *          },
 *          {
 *            "type": "tableRow",
 *            "children": [
 *              {
 *                "type": "tableCell",
 *                "children": [
 *                  {
 *                    "type": "text",
 *                    "value": "baz"
 *                  }
 *                ]
 *              },
 *              {
 *                "type": "tableCell",
 *                "children": [
 *                  {
 *                    "type": "text",
 *                    "value": "qux"
 *                  }
 *                ]
 *              }
 *            ]
 *          }
 *        ]
 *      }
 *    ]
 *    ```
 */
