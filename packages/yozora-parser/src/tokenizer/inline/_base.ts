import {
  CodePoint,
  InlineDataNodeType,
} from '@yozora/core'
import {
  DataNodeTokenPosition,
  DataNodeTokenPointDetail,
} from '../../types/position'
import {
  DataNodeTokenizerContext,
  DataNodeTokenizer,
  DataNodeTokenizerConstructor,
} from '../../types/tokenizer'
import {
  mergeTwoOrderedPositions,
  mergeLowerPriorityPositions,
  removeIntersectPositions,
  foldContainedPositions,
} from '../../util/position'


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
      if (i >= itp.left.start) {
        i = Math.max(i, itp.right.end)
        continue
      }
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
export class BaseInlineDataNodeTokenizerContext
  implements DataNodeTokenizerContext<InlineDataNodeType> {
  protected readonly tokenizers: DataNodeTokenizer<InlineDataNodeType>[]
  protected readonly fallbackTokenizer: DataNodeTokenizer<InlineDataNodeType>

  public constructor(
    FallbackTokenizerConstructor: DataNodeTokenizerConstructor<InlineDataNodeType>,
  ) {
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
    const tokenizer: DataNodeTokenizer<InlineDataNodeType> =
      new TokenizerConstructor!(self, priority, name)
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
    return self.deepMatch(content, codePoints, [], startOffset, endOffset, 0)
  }

  protected deepMatch(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    innerTokenPositions: DataNodeTokenPosition<InlineDataNodeType>[],
    startOffset: number,
    endOffset: number,
    tokenizerStartIndex: number,
  ): DataNodeTokenPosition<InlineDataNodeType>[] {
    const self = this
    let tokenPositions: DataNodeTokenPosition<any>[] = [...innerTokenPositions]
    if (tokenizerStartIndex < self.tokenizers.length) {
      let currentPriority = self.tokenizers[tokenizerStartIndex].priority
      /**
       * 高优先级分词器解析得到的边界列表（累计）
       */
      let higherPriorityPositions: DataNodeTokenPosition<any>[] = tokenPositions
      /**
       * 和 <currentPriority> 同优先级的分词器解析得到的边界列表
       */
      let currentPriorityPositions: DataNodeTokenPosition<any>[] = []
      const processCurrentPriorityPositions = (tokenizerStartIndex: number) => {
        if (currentPriorityPositions.length > 0) {
          /**
           * 先和高优先级的边进行合并，这样在递归处理时，更低优先级的分词器
           * 才能够看到高优先级词的边界
           */
          currentPriorityPositions = removeIntersectPositions(currentPriorityPositions)
          tokenPositions = foldContainedPositions(
            removeIntersectPositions(
              mergeLowerPriorityPositions(tokenPositions, currentPriorityPositions))
          )
          /**
           * 合并仅该边内部的属性，引用自身并没有该边，因此可直接同各国遍历
           * currentPriorityPositions 就能拿到当前优先级下的分词器的分词结果；
           * 对其进行递归分词处理，此时仅需考虑比 currentPriority 更低优先级的
           * 分词器即可
           */
          for (const cpp of currentPriorityPositions) {
            if (cpp._unExcavatedContentPieces == null) continue
            for (const ucp of cpp._unExcavatedContentPieces) {
              const { start, end } = ucp
              cpp.children = self.deepMatch(
                content, codePoints, cpp.children as DataNodeTokenPosition<any>[],
                start, end, tokenizerStartIndex)
            }
          }

          /**
           * 清理操作
           */
          currentPriorityPositions = []
        }
      }

      for (let i = tokenizerStartIndex; i < self.tokenizers.length; ++i) {
        const tokenizer = self.tokenizers[i]
        /**
         * 当前的分词器的优先级比 <currentPriority> 低时，说明与 <currentPriority> 同
         * 优先级的分词器已经解析完毕：
         *  - 将 <currentPriorityPositions> 合并进 <tokenPositions> 中去
         *  - 更新 <currentPriority> 为当前分词器的优先级
         *  - 更新高优先级边界列表为 <tokenPositions>
         */
        if (tokenizer.priority < currentPriority) {
          processCurrentPriorityPositions(i)
          currentPriority = tokenizer.priority
          higherPriorityPositions = tokenPositions
        }

        /**
         * 使用当前分词器进行解析，并将得到的边界列表合并进 <currentPriorityPositions> 中去
         */
        const positions = tokenizer.match(
          content, codePoints, higherPriorityPositions, startOffset, endOffset)
        currentPriorityPositions = mergeTwoOrderedPositions(currentPriorityPositions, positions)
      }

      /**
       * 将 <currentPriorityPositions> 合并进 <tokenPositions> 中去
       */
      if (currentPriorityPositions.length > 0) {
        processCurrentPriorityPositions(self.tokenizers.length)
      }
    }

    /**
     * 使用 fallback 分词器解析剩下的未被处理的内容
     * 并将得到的边界列表合并进 tokenPositions 中去
     */
    const positions = self.fallbackTokenizer.match(
      content, codePoints, tokenPositions, startOffset, endOffset)
    if (positions.length > 0) {
      tokenPositions = removeIntersectPositions(
        mergeTwoOrderedPositions(tokenPositions, positions))
    }
    return foldContainedPositions(tokenPositions)
  }
}
