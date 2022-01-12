import type { Parent } from '../ast'
import type { TableCell } from './table-cell'

export const TableRowType = 'tableRow'
export type TableRowType = typeof TableRowType

/**
 * TableRow represents a row of cells in a table.
 * @see https://github.com/syntax-tree/mdast#tablerow
 * @see https://github.github.com/gfm/#tables-extension-
 */
export interface TableRow extends Parent<TableRowType> {
  /**
   * Table cells
   */
  children: TableCell[]
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
