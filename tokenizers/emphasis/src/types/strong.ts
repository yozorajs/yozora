import type {
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
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
 * Delimiter of EmphasisStrongToken
 */
export interface EmphasisStrongTokenDelimiter
  extends InlineTokenDelimiter<'opener' | 'both' | 'closer'> {
  /**
   * The original thickness of the delimiter
   */
  originalThickness: number
}


/**
 * Potential token of EmphasisStrong
 */
export interface EmphasisStrongPotentialToken
  extends InlinePotentialToken<EmphasisStrongType, InlineTokenDelimiter> {
  /**
   * Start/Left Delimiter of EmphasisStrongToken
   */
  openerDelimiter: InlineTokenDelimiter
  /**
   * End/Right Delimiter of EmphasisStrongToken
   */
  closerDelimiter: InlineTokenDelimiter
  /**
   * Internal raw content fragments
   */
  innerRawContents: Exclude<InlinePotentialToken['innerRawContents'], undefined>
}


/**
 * State of match phase of EmphasisTokenizer
 */
export interface EmphasisStrongMatchPhaseState
  extends InlineTokenizerMatchPhaseState<EmphasisStrongType> {
  /**
   * Start/Left Delimiter of EmphasisStrongToken
   */
  openerDelimiter: InlineTokenDelimiter
  /**
   * End/Right Delimiter of EmphasisStrongToken
   */
  closerDelimiter: InlineTokenDelimiter
}
