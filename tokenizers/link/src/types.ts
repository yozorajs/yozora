import type { NodeInterval } from '@yozora/character'
import type { YastNode, YastParent, YastResource } from '@yozora/tokenizercore'
import type {
  YastToken,
  YastTokenDelimiter,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Link
 */
export const LinkType = 'link'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type LinkType = typeof LinkType


/**
 * 超链接
 * Link represents a hyperlink.
 *
 * @example
 *    ````markdown
 *    [alpha](https://example.com "bravo")
 *    ````
 *    ===>
 *    ```json
 *    [
 *      {
 *        "type": "link",
 *        "url": "https://example.com",
 *        "title": "bravo",
 *        "children": [
 *          {
 *            "type": "text",
 *            "value": "alpha"
 *          }
 *        ]
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#link
 * @see https://github.github.com/gfm/#inline-link
 */
export interface Link extends
  YastResource,
  YastNode<LinkType>,
  YastParent<YastNode> { }


/**
 * A link token.
 */
export interface LinkToken extends YastToken<LinkType> {
  /**
   * Link destination interval.
   */
  destinationContent?: NodeInterval
  /**
   * Link title interval.
   */
  titleContent?: NodeInterval
}


/**
 * Delimiter of LinkToken.
 */
export interface LinkTokenDelimiter extends YastTokenDelimiter {
  /**
   * Delimiter type.
   */
  type: 'opener' | 'closer'
  /**
   * Link destination interval.
   */
  destinationContent?: NodeInterval
  /**
   * Link title interval.
   */
  titleContent?: NodeInterval
}
