import type { IYastNode, IYastParent } from '../ast'

export const AdmonitionType = 'admonition'
export type AdmonitionType = typeof AdmonitionType

/**
 * Admonitions are block elements. The titles can include inline markdown and
 * the body can include any block markdown except another admonition.
 * @see https://github.com/elviswolcott/remark-admonitions
 */
export interface IAdmonition extends IYastParent<AdmonitionType> {
  /**
   * Keyword of an admonition.
   */
  keyword: 'note' | 'important' | 'tip' | 'caution' | 'warning' | string
  /**
   * Admonition title.
   */
  title: IYastNode[]
}

/**
 * Example:
 *
 *    ````markdown
 *    :::tip pro tip
 *    admonition is awesome!
 *    :::
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "admonition",
 *      "keyword": "tip",
 *      "title": [
 *        {
 *          "type": "text",
 *          "value": "pro tip"
 *        }
 *      ],
 *      "children": [
 *        {
 *          "type": "paragraph",
 *          "children": [
 *            {
 *              "type": "text",
 *              "value": "admonition is awesome!\n"
 *            }
 *          ]
 *        }
 *      ]
 *    }
 *    ```
 */
