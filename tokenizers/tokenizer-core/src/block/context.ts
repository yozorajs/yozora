import { DataNodeTokenPointDetail, DataNodeTokenPosition } from '../_types/token'
import {
  BlockDataNode,
  BlockDataNodeType,
  BlockDataNodeTokenizer,
  BlockDataNodeTokenizerConstructor,
  BlockDataNodeTokenizerConstructorParams,
  BlockDataNodeTokenizerContext,
} from './types'


/**
 * 块状数据的分词器的上下文
 */
export class BaseBlockDataNodeTokenizerContext implements BlockDataNodeTokenizerContext {
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
    startOffset: number,
    endOffset: number,
  ): DataNodeTokenPosition[] {
    const self = this
    return []
  }

  /**
   * override
   */
  public parse(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPositions: DataNodeTokenPosition[],
    startOffset: number,
    endOffset: number,
  ): BlockDataNode[] {
    const self = this
    // 确保数组下标不会溢出
    if (codePoints.length === endOffset) {
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
