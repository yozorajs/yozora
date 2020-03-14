import { CodePoint, InlineDataNodeType, isUnicodeWhiteSpace } from '@yozora/core'
import { DataNodeTokenPosition, DataNodeTokenPointDetail } from '../../types/position'
import { DataNodeTokenizerContext, DataNodeTokenizer, DataNodeTokenizerConstructor } from '../../types/tokenizer'
import { mergeTwoOrderedPositions, mergeLowerPriorityPositions, removeIntersectFlanking } from '../../util/position'


/**
 * 内联数据的词法分析器的抽象类
 */
export abstract class BaseInlineDataNodeTokenizer<
  T extends InlineDataNodeType,
  R extends DataNodeTokenPosition<T>,
  EatingState,
  > implements DataNodeTokenizer<T>  {
  public readonly name: string = 'InlineTokenizer'
  public readonly priority: number
  protected readonly context: DataNodeTokenizerContext<InlineDataNodeType>

  public constructor(
    context: DataNodeTokenizerContext<InlineDataNodeType>,
    priority: number,
    name?: string
  ) {
    this.context = context
    this.priority = priority
    if (name != null) this.name = name
  }

  public match(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    innerTokenPositions: DataNodeTokenPosition<InlineDataNodeType>[],
    startOffset: number,
    endOffset: number,
  ): R[] {
    if (startOffset >= endOffset) return []

    const self = this
    const result: R[] = []
    const state: EatingState = {} as any
    self.initializeEatingState(state)

    let i = startOffset
    let precedingTokenPosition: DataNodeTokenPosition<InlineDataNodeType> | null = null
    for (const itp of innerTokenPositions) {
      if (i >= itp.right.end) continue
      self.eatTo(
        content,
        codePoints,
        precedingTokenPosition,
        state,
        i,
        itp.left.start,
        result,
        i > startOffset ? codePoints[i-1].codePoint : undefined,
        itp.left.start < endOffset ? codePoints[itp.left.start].codePoint : undefined,
      )
      i = itp.right.end
      precedingTokenPosition = itp
    }

    if (i < endOffset) {
      self.eatTo(
        content,
        codePoints,
        precedingTokenPosition,
        state,
        i,
        endOffset,
        result,
        i > startOffset ? codePoints[i - 1].codePoint : undefined,
        undefined,
      )
    }

    // sort by <start, end>
    return result.sort((x, y) => {
      const d = x.left.start - y.left.start
      if (d === 0) return x.right.end - y.right.end
      return d
    })
  }

  /**
   * 消耗 unicode 空白字符
   *
   * @param content
   * @param codePoints
   * @param startOffset
   * @param endOffset
   * @return the position of the first non-whitespace character
   * @see https://github.github.com/gfm/#whitespace-character
   */
  protected eatOptionalWhiteSpaces(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startOffset: number,
    endOffset: number,
  ): number {
    for (let i = startOffset; i < endOffset; ++i) {
      const p = codePoints[i]
      if (!isUnicodeWhiteSpace(p.codePoint)) return i
    }
    return endOffset
  }

  /**
   * 消耗空行，在碰到非空行时，回退到该非空行的第一个字符处
   *
   * Move forward from the first character of a line, and when it encounters a non-empty line,
   * go back to the first character of the non-blank line
   *
   * @param content
   * @param codePoints
   * @param startOffset
   * @param endOffset
   * @return the position of the first non-whitespace character
   * @see https://github.github.com/gfm/#blank-line
   */
  protected eatOptionalBlankLines(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startOffset: number,
    endOffset: number,
  ): number {
    let lastNonBlankLineStartOffset = startOffset
    for (let i = startOffset; i < endOffset; ++i) {
      const p = codePoints[i]
      if (!isUnicodeWhiteSpace(p.codePoint)) break
      if (p.codePoint === CodePoint.LINE_FEED) lastNonBlankLineStartOffset = i + 1
    }
    return lastNonBlankLineStartOffset
  }

  /**
   * 用于在 match 函数中回调，在过滤掉所有内部优先级更高的位置的前提下
   * 执行匹配操作
   *
   * @param content                 待匹配的内容
   * @param codePoints              待匹配的内容的 unicode 编码信息
   * @param precedingTokenPosition  匹配的起始位置之前的最近数据节点位置信息
   * @param state                   eatTo 函数的状态
   * @param startOffset             起始的偏移位置
   * @param endOffset               结束的偏移位置
   * @param result                  所有匹配到的左右边界的集合
   * @param precededCharacter       待匹配内容的前一个字符（仅用于边界判断）
   * @param followedCharacter       待匹配内容的后一个字符（仅用于边界判断）
   */
  protected abstract eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: DataNodeTokenPosition<InlineDataNodeType> | null,
    state: EatingState,
    startOffset: number,
    endOffset: number,
    result: DataNodeTokenPosition<T>[],
    precededCharacter?: CodePoint,
    followedCharacter?: CodePoint,
  ): void

  /**
   * 初始化 eatToState
   * @param state
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected initializeEatingState(state: EatingState): void { }
}


/**
 * 内联数据的分词器的上下文
 */
export class BaseInlineDataNodeTokenizerContext implements DataNodeTokenizerContext<InlineDataNodeType> {
  protected readonly tokenizers: DataNodeTokenizer<InlineDataNodeType>[]
  protected readonly fallbackTokenizer: DataNodeTokenizer<InlineDataNodeType>

  public constructor(FallbackTokenizerConstructor: DataNodeTokenizerConstructor<InlineDataNodeType>) {
    this.tokenizers = []
    this.fallbackTokenizer = new FallbackTokenizerConstructor(this, -1, '__inline_fallback__')
  }

  /**
   * override
   */
  public useTokenizer(
    priority: number,
    TokenizerConstructor: DataNodeTokenizerConstructor<InlineDataNodeType>,
    name?: string,
  ): this {
    const self = this
    const tokenizer: DataNodeTokenizer<InlineDataNodeType> = new TokenizerConstructor!(self, priority, name)
    self.tokenizers.push(tokenizer)
    self.tokenizers.sort((x, y) => y.priority - x.priority)
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
  ): DataNodeTokenPosition<InlineDataNodeType>[] {
    const self = this
    let tokenPositions: DataNodeTokenPosition<any>[] = []

    if (self.tokenizers.length > 0) {
      let currentPriority = self.tokenizers[0].priority
      let innerPositions: DataNodeTokenPosition<any>[] = tokenPositions
      let lowerPositions: DataNodeTokenPosition<any>[] = []
      for (const tokenizer of this.tokenizers) {
        if (tokenizer.priority < currentPriority) {
          if (lowerPositions.length > 0) {
            tokenPositions = mergeLowerPriorityPositions(tokenPositions, lowerPositions)
            lowerPositions = []
          }
          currentPriority = tokenizer.priority
          innerPositions = tokenPositions
        }

        const positions = tokenizer.match(
          content, codePoints, innerPositions, startOffset, endOffset)
        lowerPositions = removeIntersectFlanking(mergeTwoOrderedPositions(lowerPositions, positions), false)
      }
      if (lowerPositions.length > 0) {
        tokenPositions = removeIntersectFlanking(mergeTwoOrderedPositions(tokenPositions, lowerPositions), false)
      }
    }

    const positions = self.fallbackTokenizer.match(
      content, codePoints, tokenPositions, 0, codePoints.length)
    if (positions.length > 0) {
      tokenPositions = removeIntersectFlanking(mergeTwoOrderedPositions(tokenPositions, positions), false)
    }
    return tokenPositions
  }
}
