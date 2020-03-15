import { InlineDataNodeType, DataNode } from '@yozora/core'
import { InlineDataNodeTokenizerContext } from './tokenizer/inline/_context'
import { TextTokenizer } from './tokenizer/inline/text'
import { DeleteTokenizer } from './tokenizer/inline/delete'
import { EmphasisTokenizer } from './tokenizer/inline/emphasis'
import { ImageTokenizer } from './tokenizer/inline/image'
import { InlineCodeTokenizer } from './tokenizer/inline/inline-code'
import { InlineFormulaTokenizer } from './tokenizer/inline/inline-formula'
import { InlineHTMLCommentTokenizer } from './tokenizer/inline/inline-html-comment'
import { InlineLinkTokenizer } from './tokenizer/inline/inline-link'
import { LineBreakTokenizer } from './tokenizer/inline/line-break'
import { ReferenceImageTokenizer } from './tokenizer/inline/reference-image'
import { ReferenceLinkTokenizer } from './tokenizer/inline/reference-link'
import { DataNodeTokenizerContext, DataNodeTokenizerConstructor } from './types/tokenizer'
import { DataNodeTokenPosition, DataNodeTokenPointDetail } from './types/position'
import { calcDataNodeTokenPointDetail } from './util/position'


export * from './tokenizer/inline/_base'
export * from './tokenizer/inline/_context'
export * from './tokenizer/inline/delete'
export * from './tokenizer/inline/emphasis'
export * from './tokenizer/inline/image'
export * from './tokenizer/inline/inline-formula'
export * from './tokenizer/inline/inline-code'
export * from './tokenizer/inline/inline-link'
export * from './tokenizer/inline/inline-html-comment'
export * from './tokenizer/inline/line-break'
export * from './tokenizer/inline/reference-image'
export * from './tokenizer/inline/reference-link'
export * from './tokenizer/inline/text'
export * from './types/position'
export * from './types/tokenizer'
export * from './util/position'


export class DataNodeParser {
  protected readonly inlineContext: DataNodeTokenizerContext<InlineDataNodeType>
  public constructor(FallbackTokenizerConstructor: DataNodeTokenizerConstructor<InlineDataNodeType>) {
    this.inlineContext = new InlineDataNodeTokenizerContext(FallbackTokenizerConstructor)
  }

  /**
   * override
   */
  public useInlineDataTokenizer(
    tokenizerOrPriority: number,
    TokenizerConstructor: DataNodeTokenizerConstructor<InlineDataNodeType>,
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
  ): DataNodeTokenPosition<InlineDataNodeType>[] {
    if (codePoints == null) {
      // eslint-disable-next-line no-param-reassign
      codePoints = calcDataNodeTokenPointDetail(content)
    }
    if (codePoints == null || codePoints.length <= 0) return []

    const s = Math.min(codePoints.length - 1,
      Math.max(0, startOffset == null ? 0 : startOffset))
    const t = Math.min(codePoints.length,
      Math.max(0, endOffset == null ? codePoints.length : endOffset))
    if (s >= t ) return []
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
    tokenPositions?: DataNodeTokenPosition<InlineDataNodeType>[],
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
    if (s >= t ) return []
    if (tokenPositions == null) {
      // eslint-disable-next-line no-param-reassign
      tokenPositions = this.matchInlineData(content, codePoints, s, t)
    }
    return this.inlineContext.parse(content, codePoints, tokenPositions, s, t)
  }
}


export const dataNodeParser = new DataNodeParser(TextTokenizer)
dataNodeParser
  .useInlineDataTokenizer(1, DeleteTokenizer)
  .useInlineDataTokenizer(1, EmphasisTokenizer)
  .useInlineDataTokenizer(2, LineBreakTokenizer)
  .useInlineDataTokenizer(3, ReferenceLinkTokenizer)
  .useInlineDataTokenizer(3.1, ReferenceImageTokenizer)
  .useInlineDataTokenizer(3, InlineLinkTokenizer)
  .useInlineDataTokenizer(3.1, ImageTokenizer)
  .useInlineDataTokenizer(4, InlineFormulaTokenizer)
  .useInlineDataTokenizer(4, InlineCodeTokenizer)
  .useInlineDataTokenizer(4, InlineHTMLCommentTokenizer)

