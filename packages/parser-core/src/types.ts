import {
  DataNode,
  InlineDataNodeTokenPosition,
  DataNodeTokenPointDetail,
} from '@yozora/tokenizer-core'


/**
 * A parser consisting of DataNodeTokenizers
 */
export interface DataNodeParser {
  /**
   * match content
   */
  matchInlineData(
    content: string,
    codePoints?: DataNodeTokenPointDetail[],
    startOffset?: number,
    endOffset?: number,
  ): InlineDataNodeTokenPosition[]

  /**
   * parse matched results
   */
  parseInlineData(
    content: string,
    codePoints?: DataNodeTokenPointDetail[],
    startOffset?: number,
    endOffset?: number,
    tokenPositions?: InlineDataNodeTokenPosition[],
  ): DataNode[]
}
