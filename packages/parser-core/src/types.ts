import {
  DataNode,
  DataNodeTokenPosition,
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
