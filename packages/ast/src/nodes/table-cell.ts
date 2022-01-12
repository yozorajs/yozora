import type { IYastParent } from '../ast'

export const TableCellType = 'tableCell'
export type TableCellType = typeof TableCellType

/**
 * TableCell represents a header cell in a Table, if its parent is a head,
 * or a data cell otherwise.
 * @see https://github.com/syntax-tree/mdast#tablecell
 * @see https://github.github.com/gfm/#tables-extension-
 */
export type TableCell = IYastParent<TableCellType>

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
