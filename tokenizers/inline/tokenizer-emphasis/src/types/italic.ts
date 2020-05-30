import {
  InlineDataNode,
  InlineTokenDelimiterItem,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof ItalicEmphasisDataNode
 */
export const ItalicEmphasisDataNodeType = 'EMPHASIS_ITALIC'
export type ItalicEmphasisDataNodeType = typeof ItalicEmphasisDataNodeType


/**
 * 斜体；强调的内容
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
 *          type: 'ITALIC',
 *          children: [{ type: 'TEXT', value: 'alpha' }]
 *        },
 *        { type: 'TEXT', value: ' ' },
 *        {
 *          type: 'ITALIC',
 *          children: [{ type: 'TEXT', value: 'bravo' }]
 *        }
 *      ]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#emphasis
 * @see https://github.github.com/gfm/#emphasis-and-italic-emphasis
 */
export interface ItalicEmphasisDataNode extends
  InlineDataNode<ItalicEmphasisDataNodeType>,
  InlineTokenizerParsePhaseState<ItalicEmphasisDataNodeType> {
  /**
   *
   */
  children: InlineTokenizerParsePhaseState[]
}


/**
 * State of pre-match phase of EmphasisTokenizer
 */
export interface ItalicEmphasisPreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<ItalicEmphasisDataNodeType> {
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
export interface ItalicEmphasisMatchPhaseState
  extends InlineTokenizerMatchPhaseState<ItalicEmphasisDataNodeType> {
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
