import type { YastParent } from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerPostMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof EmphasisStrong
 */
export const EmphasisStrongType = 'strong'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type EmphasisStrongType = typeof EmphasisStrongType


/**
 * 粗体；强调的内容
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
 * @see https://github.com/syntax-tree/mdast#strong
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 */
export interface EmphasisStrong extends
  YastInlineNode<EmphasisStrongType>, YastParent<YastInlineNode> {

}


/**
 * State on match phase of EmphasisTokenizer
 */
export type EmphasisStrongMatchPhaseState =
  & InlineTokenizerMatchPhaseState<EmphasisStrongType>
  & EmphasisStrongMatchPhaseStateData


/**
 * State on post-match phase of EmphasisTokenizer
 */
export type EmphasisStrongPostMatchPhaseState =
  & InlineTokenizerPostMatchPhaseState<EmphasisStrongType>
  & EmphasisStrongMatchPhaseStateData

/**
 * State data on match phase of EmphasisTokenizer
 */
export interface EmphasisStrongMatchPhaseStateData {
  /**
   * Start/Left Delimiter of EmphasisStrongToken
   */
  openerDelimiter: InlineTokenDelimiter
  /**
   * End/Right Delimiter of EmphasisStrongToken
   */
  closerDelimiter: InlineTokenDelimiter
}


/**
 * Delimiter of EmphasisStrongToken.
 */
export interface EmphasisStrongTokenDelimiter extends InlineTokenDelimiter {
  /**
   * Thickness of the delimiter.
   */
  thickness: number
  /**
   * The original thickness of the delimiter.
   */
  originalThickness: number
}
