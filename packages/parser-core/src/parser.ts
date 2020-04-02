import {
  DataNode,
  DataNodeTokenPosition,
  DataNodeTokenPointDetail,
  DataNodeTokenizerContext,
  InlineDataNodeTokenizerConstructor,
  BaseInlineDataNodeTokenizerContext,
  calcDataNodeTokenPointDetail,
} from '@yozora/tokenizer-core'
import { DataNodeParser } from './types'


export class BaseDataNodeParser implements DataNodeParser {
  protected readonly inlineContext: DataNodeTokenizerContext
  public constructor(FallbackTokenizerConstructor?: InlineDataNodeTokenizerConstructor) {
    this.inlineContext = new BaseInlineDataNodeTokenizerContext(FallbackTokenizerConstructor)
  }

  /**
   * register InlineDataTokenizer into parser
   * @param tokenizerOrPriority
   * @param TokenizerConstructor
   */
  public useInlineDataTokenizer(
    tokenizerOrPriority: number,
    TokenizerConstructor: InlineDataNodeTokenizerConstructor,
  ): this {
    this.inlineContext.useTokenizer(tokenizerOrPriority, TokenizerConstructor)
    return this
  }

  /**
   * override
   */
  public matchInlineData(
    content: string,
    codePoints?: DataNodeTokenPointDetail[],
    startOffset?: number,
    endOffset?: number,
  ): DataNodeTokenPosition[] {
    if (codePoints == null) {
      // eslint-disable-next-line no-param-reassign
      codePoints = calcDataNodeTokenPointDetail(content)
    }
    if (codePoints == null || codePoints.length <= 0) return []

    const s = Math.min(codePoints.length - 1,
      Math.max(0, startOffset == null ? 0 : startOffset))
    const t = Math.min(codePoints.length,
      Math.max(0, endOffset == null ? codePoints.length : endOffset))
    if (s >= t) return []
    return this.inlineContext.match(content, codePoints, s, t)
  }

  /**
   * override
   */
  public parseInlineData(
    content: string,
    codePoints?: DataNodeTokenPointDetail[],
    startOffset?: number,
    endOffset?: number,
    tokenPositions?: DataNodeTokenPosition[],
  ): DataNode[] {
    if (codePoints == null) {
      // eslint-disable-next-line no-param-reassign
      codePoints = calcDataNodeTokenPointDetail(content)
    }
    if (codePoints == null || codePoints.length <= 0) return []

    const s = Math.min(codePoints.length - 1,
      Math.max(0, startOffset == null ? 0 : startOffset))
    const t = Math.min(codePoints.length,
      Math.max(0, endOffset == null ? codePoints.length : endOffset))
    if (s >= t) return []
    if (tokenPositions == null) {
      // eslint-disable-next-line no-param-reassign
      tokenPositions = this.matchInlineData(content, codePoints, s, t)
    }
    return this.inlineContext.parse(content, codePoints, tokenPositions, s, t)
  }
}
