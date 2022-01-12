import type { IYastAlignType, IYastParent } from '../ast'
import type { TableRow } from './table-row'

export const TableType = 'table'
export type TableType = typeof TableType

/**
 * Table column configs.
 */
export interface TableColumn {
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
export interface Table extends IYastParent<TableType> {
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
