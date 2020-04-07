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
    startIndex?: number,
    endIndex?: number,
  ): InlineDataNodeTokenPosition[]

  /**
   * parse matched results
   */
  parseInlineData(
    content: string,
    codePoints?: DataNodeTokenPointDetail[],
    startIndex?: number,
    endIndex?: number,
    tokenPositions?: InlineDataNodeTokenPosition[],
  ): DataNode[]
}
