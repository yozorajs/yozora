import type { YastParent } from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerPostMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof EmphasisItalic
 */
export const EmphasisItalicType = 'emphasis'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type EmphasisItalicType = typeof EmphasisItalicType


/**
 * 斜体；强调的内容
 * Emphasis represents stress emphasis of its contents.
 *
 * @example
 *    ````markdown
 *    *alpha* _bravo_ **alpha** __bravo__
 *    ````
 *    ===>
 *    ```json
 *    [
 *      {
 *        "type": "emphasis",
 *        "children": [
 *          { "type": "text", "value": "alpha" }
 *        ]
 *      },
 *      { "type": "text", "value": " " },
 *      {
 *        "type": "emphasis",
 *        "children": [
 *          { "type": "text", "value": "bravo" }
 *        ]
 *      },
 *      {
 *        "type": "strong",
 *        "children": [
 *          { "type": "text", "value": "alpha" }
 *        ]
 *      },
 *      { "type": "text", "value": " " },
 *      {
 *        "type": "strong",
 *        "children": [
 *          { "type": "text", "value": "bravo" }
 *        ]
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#emphasis
 * @see https://github.github.com/gfm/#emphasis-and-italic-emphasis
 */
export interface EmphasisItalic extends
  YastInlineNode<EmphasisItalicType>, YastParent<YastInlineNode> {

}


/**
 * State on match phase of EmphasisTokenizer
 */
export type EmphasisItalicMatchPhaseState =
  & InlineTokenizerMatchPhaseState<EmphasisItalicType>
  & EmphasisItalicMatchPhaseStateData


/**
 * State on post-match phase of EmphasisTokenizer
 */
export type EmphasisItalicPostMatchPhaseState =
  & InlineTokenizerPostMatchPhaseState<EmphasisItalicType>
  & EmphasisItalicMatchPhaseStateData


/**
 * State data on match phase of EmphasisTokenizer
 */
export interface EmphasisItalicMatchPhaseStateData {
  /**
   * Start/Left Delimiter of EmphasisItalicToken
   */
  openerDelimiter: InlineTokenDelimiter
  /**
   * End/Right Delimiter of EmphasisItalicToken
   */
  closerDelimiter: InlineTokenDelimiter
}


/**
 * Delimiter of EmphasisItalicToken.
 */
export interface EmphasisItalicTokenDelimiter extends InlineTokenDelimiter {
  /**
   * Thickness of the delimiter.
   */
  thickness: number
  /**
   * The original thickness of the delimiter.
   */
  originalThickness: number
}
