import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPostMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof EmphasisStrong
 */
export const EmphasisStrongType = 'EMPHASIS_STRONG'
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
 *        "type": "EMPHASIS_ITALIC",
 *        "children": [
 *          {
 *            "type": "TEXT",
 *            "value": "alpha"
 *          }
 *        ]
 *      },
 *      {
 *        "type": "TEXT",
 *        "value": " "
 *      },
 *      {
 *        "type": "EMPHASIS_ITALIC",
 *        "children": [
 *          {
 *            "type": "TEXT",
 *            "value": "bravo"
 *          }
 *        ]
 *      },
 *      {
 *        "type": "EMPHASIS_STRONG",
 *        "children": [
 *          {
 *            "type": "TEXT",
 *            "value": "alpha"
 *          }
 *        ]
 *      },
 *      {
 *        "type": "TEXT",
 *        "value": " "
 *      },
 *      {
 *        "type": "EMPHASIS_STRONG",
 *        "children": [
 *          {
 *            "type": "TEXT",
 *            "value": "bravo"
 *          }
 *        ]
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#strong
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 */
export interface EmphasisStrong extends
  YastInlineNode<EmphasisStrongType>,
  InlineTokenizerParsePhaseState<EmphasisStrongType> {
  /**
   *
   */
  children: Exclude<InlineTokenizerParsePhaseState['children'], undefined>
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
