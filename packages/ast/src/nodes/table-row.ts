import type { IYastParent } from '../ast'
import type { ITableCell } from './table-cell'

export const TableRowType = 'tableRow'
export type TableRowType = typeof TableRowType

/**
 * TableRow represents a row of cells in a table.
 * @see https://github.com/syntax-tree/mdast#tablerow
 * @see https://github.github.com/gfm/#tables-extension-
 */
export interface ITableRow extends IYastParent<TableRowType> {
  /**
   * Table cells
   */
  children: ITableCell[]
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
