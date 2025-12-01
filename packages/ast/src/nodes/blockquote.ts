import type { Parent } from '../ast'

export const BlockquoteType = 'blockquote'
export type BlockquoteType = typeof BlockquoteType

export enum BlockquoteCalloutTypeEnum {
  NOTE = 'note',
  TIP = 'tip',
  IMPORTANT = 'important',
  WARNING = 'warning',
  CAUTION = 'caution',
}

export type BlockquoteCalloutType = `${BlockquoteCalloutTypeEnum}`

/**
 * Blockquote represents a section quoted from somewhere else.
 * @see https://github.com/syntax-tree/mdast#blockquote
 * @see https://github.github.com/gfm/#block-quotes
 * @see https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts
 */
export interface Blockquote extends Parent<BlockquoteType> {
  /**
   * GitHub callout type.
   * @see https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts
   */
  callout?: BlockquoteCalloutType
}

/**
 * Example:
 *
 *    ````markdown
 *    > Alpha bravo charlie.
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "blockquote",
 *      "children": [
 *        {
 *          "type": "paragraph",
 *          "children": [
 *            {
 *              "type": "text",
 *              "value": "Alpha bravo charlie."
 *            }
 *          ]
 *        }
 *      ]
 *    }
 *    ```
 */
