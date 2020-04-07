import {
  DataNode,
  DataNodeTokenPointDetail,
  InlineDataNodeTokenPosition,
  InlineDataNodeTokenizerContext,
  calcDataNodeTokenPointDetail,
} from '@yozora/tokenizer-core'
import { DataNodeParser } from './types'


export class BaseDataNodeParser implements DataNodeParser {
  protected readonly inlineContext: InlineDataNodeTokenizerContext
  public constructor(inlineContext: InlineDataNodeTokenizerContext) {
    this.inlineContext = inlineContext
  }

  /**
   * override
   */
  public matchInlineData(
    content: string,
    codePoints?: DataNodeTokenPointDetail[],
    startIndex?: number,
    endIndex?: number,
  ): InlineDataNodeTokenPosition[] {
    if (codePoints == null) {
      // eslint-disable-next-line no-param-reassign
      codePoints = calcDataNodeTokenPointDetail(content)
    }
    if (codePoints == null || codePoints.length <= 0) return []

    const s = Math.min(codePoints.length - 1,
      Math.max(0, startIndex == null ? 0 : startIndex))
    const t = Math.min(codePoints.length,
      Math.max(0, endIndex == null ? codePoints.length : endIndex))
    if (s >= t) return []
    return this.inlineContext.match(content, codePoints, s, t)
  }

  /**
   * override
   */
  public parseInlineData(
    content: string,
    codePoints?: DataNodeTokenPointDetail[],
    startIndex?: number,
    endIndex?: number,
    tokenPositions?: InlineDataNodeTokenPosition[],
  ): DataNode[] {
    if (codePoints == null) {
      // eslint-disable-next-line no-param-reassign
      codePoints = calcDataNodeTokenPointDetail(content)
    }
    if (codePoints == null || codePoints.length <= 0) return []

    const s = Math.min(codePoints.length - 1,
      Math.max(0, startIndex == null ? 0 : startIndex))
    const t = Math.min(codePoints.length,
      Math.max(0, endIndex == null ? codePoints.length : endIndex))
    if (s >= t) return []
    if (tokenPositions == null) {
      // eslint-disable-next-line no-param-reassign
      tokenPositions = this.matchInlineData(content, codePoints, s, t)
    }
    return this.inlineContext.parse(content, codePoints, tokenPositions, s, t)
  }
}
