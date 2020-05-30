import {
  InlineDataNode,
  InlineTokenDelimiterItem,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Strong EmphasisDataNode
 */
export const StrongEmphasisDataNodeType = 'EMPHASIS_STRONG'
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
 *    ```js
 *    {
 *      type: 'PARAGRAPH',
 *      children: [
 *        {
 *          type: 'EMPHASIS',
 *          children: [{ type: 'TEXT', value: 'alpha' }]
 *        },
 *        { type: 'TEXT', value: ' ' },
 *        {
 *          type: 'EMPHASIS',
 *          children: [{ type: 'TEXT', value: 'bravo' }]
 *        },
 *        {
 *          type: 'STRONG',
 *          children: [{ type: 'TEXT', value: 'alpha' }]
 *        },
 *        { type: 'TEXT', value: ' ' },
 *        {
 *          type: 'STRONG',
 *          children: [{ type: 'TEXT', value: 'bravo' }]
 *        }
 *      ]
 *    }
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
  children: InlineTokenizerParsePhaseState[]
}


/**
 * State of pre-match phase of EmphasisTokenizer
 */
export interface StrongEmphasisPreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<StrongEmphasisDataNodeType> {
  /**
   *
   */
  startIndex: number
  /**
   *
   */
  endIndex: number
  /**
   *
   */
  leftDelimiter: InlineTokenDelimiterItem
  /**
   *
   */
  rightDelimiter: InlineTokenDelimiterItem
}


/**
 * State of match phase of EmphasisTokenizer
 */
export interface StrongEmphasisMatchPhaseState
  extends InlineTokenizerMatchPhaseState<StrongEmphasisDataNodeType> {
  /**
   *
   */
  startIndex: number
  /**
   *
   */
  endIndex: number
  /**
   *
   */
  leftDelimiter: InlineTokenDelimiterItem
  /**
   *
   */
  rightDelimiter: InlineTokenDelimiterItem
}
