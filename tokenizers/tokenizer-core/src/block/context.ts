import { DataNodeTokenPointDetail } from '../_types/token'
import {
  BlockDataNode,
  BlockDataNodeMatchResult,
  BlockDataNodeTokenizer,
  BlockDataNodeTokenizerConstructor,
  BlockDataNodeTokenizerConstructorParams,
  BlockDataNodeTokenizerContext,
  BlockDataNodeType,
} from './types'


/**
 * 块状数据的分词器的上下文
 */
export class DefaultBlockDataNodeTokenizerContext implements BlockDataNodeTokenizerContext {
  protected readonly tokenizers: BlockDataNodeTokenizer[]
  protected readonly tokenizerMap: Map<BlockDataNodeType, BlockDataNodeTokenizer>
  protected readonly fallbackTokenizer?: BlockDataNodeTokenizer

  public constructor(
    FallbackTokenizerOrTokenizerConstructor?: BlockDataNodeTokenizer | BlockDataNodeTokenizerConstructor,
    fallbackTokenizerParams?: BlockDataNodeTokenizerConstructorParams,
  ) {
    this.tokenizers = []
    this.tokenizerMap = new Map()

    if (FallbackTokenizerOrTokenizerConstructor != null) {
      let fallbackTokenizer: BlockDataNodeTokenizer
      if (typeof FallbackTokenizerOrTokenizerConstructor === 'function') {
        fallbackTokenizer = new FallbackTokenizerOrTokenizerConstructor({
          priority: -1,
          name: '__block_fallback__',
          ...fallbackTokenizerParams,
        })
      } else {
        fallbackTokenizer = FallbackTokenizerOrTokenizerConstructor
      }
      this.fallbackTokenizer = fallbackTokenizer
      this.registerTokenizer(fallbackTokenizer)
    }
  }

  /**
   * override
   */
  public useTokenizer(tokenizer: BlockDataNodeTokenizer): this {
    const self = this
    self.tokenizers.push(tokenizer)
    self.tokenizers.sort((x, y) => y.priority - x.priority)
    self.registerTokenizer(tokenizer)
    return this
  }

  /**
   * override
   */
  public match(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
  ): BlockDataNodeMatchResult[] {
    const self = this
    return []
  }

  /**
   * override
   */
  public parse(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPositions: BlockDataNodeMatchResult[],
    startIndex: number,
    endIndex: number,
  ): BlockDataNode[] {
    const self = this
    // 确保数组下标不会溢出
    if (codePoints.length === endIndex) {
      const p = codePoints[codePoints.length - 1]
      // eslint-disable-next-line no-param-reassign
      codePoints = [
        ...codePoints,
        {
          line: p.line,
          column: p.column + 1,
          offset: p.offset + 1,
          codePoint: 0,
        }
      ]
    }
    return []
  }

  protected registerTokenizer(tokenizer: BlockDataNodeTokenizer) {
    for (const t of tokenizer.recognizedTypes) {
      this.tokenizerMap.set(t, tokenizer)
    }
  }
}
