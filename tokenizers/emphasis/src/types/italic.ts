import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPostMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof EmphasisItalic
 */
export const EmphasisItalicType = 'EMPHASIS_ITALIC'
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
 * @see https://github.com/syntax-tree/mdast#emphasis
 * @see https://github.github.com/gfm/#emphasis-and-italic-emphasis
 */
export interface EmphasisItalic extends
  YastInlineNode<EmphasisItalicType>,
  InlineTokenizerParsePhaseState<EmphasisItalicType> {
  /**
   *
   */
  children: Exclude<InlineTokenizerParsePhaseState['children'], undefined>
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
