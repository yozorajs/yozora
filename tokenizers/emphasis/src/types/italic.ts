import type {
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof ItalicEmphasisDataNode
 */
export const YastNodeItalicEmphasisType = 'EMPHASIS_ITALIC'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type YastNodeItalicEmphasisType = typeof YastNodeItalicEmphasisType


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
export interface YastNodeItalicEmphasis extends
  YastInlineNode<YastNodeItalicEmphasisType>,
  InlineTokenizerParsePhaseState<YastNodeItalicEmphasisType> {
  /**
   *
   */
  children: Exclude<InlineTokenizerParsePhaseState['children'], undefined>
}


/**
 * Delimiter of ItalicEmphasisToken
 */
export interface ItalicEmphasisTokenDelimiter
  extends InlineTokenDelimiter<'opener' | 'both' | 'closer'> {
  /**
   * The original thickness of the delimiter
   */
  originalThickness: number
}


/**
 * Potential token of ItalicEmphasis
 */
export interface ItalicEmphasisPotentialToken
  extends InlinePotentialToken<YastNodeItalicEmphasisType> {
  /**
   * Start/Left Delimiter of ItalicEmphasisToken
   */
  openerDelimiter: InlineTokenDelimiter
  /**
   * End/Right Delimiter of ItalicEmphasisToken
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
export interface ItalicEmphasisMatchPhaseState
  extends InlineTokenizerMatchPhaseState<YastNodeItalicEmphasisType> {
  /**
   * Start/Left Delimiter of ItalicEmphasisToken
   */
  openerDelimiter: InlineTokenDelimiter
  /**
   * End/Right Delimiter of ItalicEmphasisToken
   */
  closerDelimiter: InlineTokenDelimiter
}
