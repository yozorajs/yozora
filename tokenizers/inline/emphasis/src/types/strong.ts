import type {
  InlineDataNode,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Strong EmphasisDataNode
 */
export const StrongEmphasisDataNodeType = 'EMPHASIS_STRONG'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type StrongEmphasisDataNodeType = typeof StrongEmphasisDataNodeType


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
export interface StrongEmphasisDataNode extends
  InlineDataNode<StrongEmphasisDataNodeType>,
  InlineTokenizerParsePhaseState<StrongEmphasisDataNodeType> {
  /**
   *
   */
  children: Exclude<InlineTokenizerParsePhaseState['children'], undefined>
}


/**
 * Delimiter of StrongEmphasisToken
 */
export interface StrongEmphasisTokenDelimiter
  extends InlineTokenDelimiter<'opener' | 'both' | 'closer'> {
  /**
   * The original thickness of the delimiter
   */
  originalThickness: number
}


/**
 * Potential token of StrongEmphasis
 */
export interface StrongEmphasisPotentialToken
  extends InlinePotentialToken<StrongEmphasisDataNodeType, InlineTokenDelimiter> {
  /**
   * Start/Left Delimiter of StrongEmphasisToken
   */
  openerDelimiter: InlineTokenDelimiter
  /**
   * End/Right Delimiter of StrongEmphasisToken
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
export interface StrongEmphasisMatchPhaseState
  extends InlineTokenizerMatchPhaseState<StrongEmphasisDataNodeType> {
  /**
   * Start/Left Delimiter of StrongEmphasisToken
   */
  openerDelimiter: InlineTokenDelimiter
  /**
   * End/Right Delimiter of StrongEmphasisToken
   */
  closerDelimiter: InlineTokenDelimiter
}
