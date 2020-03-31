import {
  DataNode,
  DataNodeTokenPosition,
  DataNodeTokenPointDetail,
  InlineDataNodeTokenizerConstructor,
} from '@yozora/tokenizer-core'


/**
 * A parser consisting of DataNodeTokenizers
 */
export interface DataNodeParser {
  /**
   * register InlineDataTokenizer into parser
   * @param tokenizerOrPriority
   * @param TokenizerConstructor
   */
  useInlineDataTokenizer(
    tokenizerOrPriority: number,
    TokenizerConstructor: InlineDataNodeTokenizerConstructor,
  ): this

  /**
   * match content
   */
  matchInlineData(
    content: string,
    codePoints?: DataNodeTokenPointDetail[],
    startOffset?: number,
    endOffset?: number,
  ): DataNodeTokenPosition[]

  /**
   * parse matched results
   */
  parseInlineData(
    content: string,
    codePoints?: DataNodeTokenPointDetail[],
    startOffset?: number,
    endOffset?: number,
    tokenPositions?: DataNodeTokenPosition[],
  ): DataNode[]
}
