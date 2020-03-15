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
  public readonly acceptedTypes: T[] = []
  protected readonly context: DataNodeTokenizerContext<InlineDataNodeType>

  public constructor(
    context: DataNodeTokenizerContext<InlineDataNodeType>,
    priority: number,
    name?: string,
    acceptedTypes?: T[]
  ) {
    this.context = context
    this.priority = priority
    if (name != null) {
      this.name = name
    }
    if (acceptedTypes != null) {
      this.acceptedTypes = acceptedTypes
    }
  }

  /**
   * 抽象出 InlineDataTokenizer 的 <match> 函数的公共操作，使其无需关心
   *  <innerAtomPositions> 信息：
   *    - 将所有的 <innerAtomPositions> 视作一个原子数据，并将原待匹配内容
   *      分割成若干段投喂到 <eatTo> 函数中，最后整合成完整的 <match> 返回结果；
   *    - 对上一步的结果按照 `<left.start, right.end>` 的顺序进行升序排序
   *
   * override
   */
  public match(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    innerAtomPositions: DataNodeTokenPosition<InlineDataNodeType>[],
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
    for (const itp of innerAtomPositions) {
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
        i > startOffset ? codePoints[i - 1].codePoint : undefined,
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
  protected readonly tokenizerMap: Map<InlineDataNodeType, DataNodeTokenizer<InlineDataNodeType>>
  protected readonly fallbackTokenizer: DataNodeTokenizer<InlineDataNodeType>

  public constructor(
    FallbackTokenizerConstructor: DataNodeTokenizerConstructor<InlineDataNodeType>,
  ) {
    this.tokenizers = []
    this.tokenizerMap = new Map()
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
    for (const t of tokenizer.acceptedTypes) {
      self.tokenizerMap.set(t, tokenizer)
    }
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

  /**
   * 递归匹配
   *  A. 将分词器列表按照优先级从大到小排序，遍历分词器列表记当前值为 <tokenizer>，
   *     其优先级为 <currentPriority>；并将之前更高优先级分词器的处理结果记为
   *     <higherPriorityPositions>;
   *     I.   遍历分词器列表中所有优先级为 <currentPriority> 的分词器，将
   *          <higherPriorityPositions> 作为参数依次传入这些分词器中获得对应的分词
   *          解析结果列表，合并这些列表，并进行去相交处理（发生相交的两个边界，杀
   *          死左边界大的那一个），将结果记为 <currentPriorityPositions>
   *     II.  将 <currentPriorityPositions> 合并进 <higherPriorityPositions> 中，并
   *          执行去相交处理；并对新的 <higherPriorityPositions> 执行折叠操作（将被
   *          包含的边界添加进包含边界所属的 TokenData 的 <children> 属性中；若包含
   *          边界中设置了 <children> 中 TokenDataType 的黑名单，说明此包含边界是个
   *          无效边界，此时杀死包含边界，保留被包含边界）
   *     III. 遍历 <currentPriorityPositions> 记当前值为 <cpp>，当属性
   *          <_unExcavatedContentPieces> 存在且不为 null/undefined 时，说明 <cpp>
   *          内部还有需要进一步匹配的内容段；遍历 <_unExcavatedContentPieces>，并
   *          仅使用优先级小于 <currentPriority> 的 <tokenizer> 处理；
   *          因为匹配的过程中是按高优先级分词器优先进行匹配的原则，因此对于某个分词器
   *          匹配到的数据中的 <_unExcavatedContentPieces> 中即便有满足更高优先级分词器
   *          数据，也必然在此前处理过了，因此仅需从比当前分词器 <tokenizer> 更低优先级
   *          的分词器开始匹配即可。
   *  B. 将 A 中当前遍历的分词器下标调至第一个优先级小于 <currentPriority> 的解析器
   *     的下标
   *
   *
   * 可优化的点
   *  - [x] A.I 可以通过使用一个空列表记录 <currentPriorityPositions>, 再每次 <tokenizer>
   *        处理完毕时就理解合并进 <currentPriorityPositions> 中，仅当 <tokenizer.priority>
   *        小于 <currentPriority> 时，才更新 <currentPriority>，并执行 A.II 及其后续操作，
   *        最后将 <currentPriorityPositions> 重置为空数组；以此去掉 A.I 中的内层循环和步骤 B
   *  - [ ] A.III 可以过滤掉 <currentPriorityPositions> 中在 A.II 被杀死的边界，以剪掉
   *        无用的递归处理
   * @protected
   * @param content
   * @param codePoints
   * @param innerAtomPositions    当前待匹配内容中已得到的分词位置信息，后续的分词处理中
   *                              它们将被视为原子位置
   * @param startOffset           待匹配内容的左边界（开）
   * @param endOffset             待匹配内容的右边界（闭）
   * @param tokenizerStartIndex   this.tokenizers 的下标，表示从指定下标开始开始选择分词器
   */
  protected deepMatch(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    innerAtomPositions: DataNodeTokenPosition<InlineDataNodeType>[],
    startOffset: number,
    endOffset: number,
    tokenizerStartIndex: number,
  ): DataNodeTokenPosition<InlineDataNodeType>[] {
    const self = this
    /**
     * 高优先级分词器解析得到的边界列表（累计）
     */
    let higherPriorityPositions: DataNodeTokenPosition<any>[] = [...innerAtomPositions]
    if (tokenizerStartIndex < self.tokenizers.length) {
      let currentPriority = self.tokenizers[tokenizerStartIndex].priority
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
          higherPriorityPositions = foldContainedPositions(
            removeIntersectPositions(
              mergeLowerPriorityPositions(higherPriorityPositions, currentPriorityPositions))
          )
          /**
           * 合并进该边内部的属性，引用自身并没有该边，因此可直接通过遍历
           * <currentPriorityPositions> 就能拿到当前优先级下的分词器的分词结果；
           * 对其进行递归分词处理，此时仅需考虑比 <currentPriority> 更低优先级的
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

          // 清理操作
          currentPriorityPositions = []
        }
      }

      for (let i = tokenizerStartIndex; i < self.tokenizers.length; ++i) {
        const tokenizer = self.tokenizers[i]
        /**
         * 当前的分词器的优先级比 <currentPriority> 低时，说明与 <currentPriority> 同
         * 优先级的分词器已经解析完毕：
         *  - 将 <currentPriorityPositions> 合并进 <higherPriorityPositions> 中去
         *  - 更新 <currentPriority> 为当前分词器的优先级
         *  - 更新高优先级边界列表为 <higherPriorityPositions>
         */
        if (tokenizer.priority < currentPriority) {
          processCurrentPriorityPositions(i)
          currentPriority = tokenizer.priority
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
     * 并将得到的边界列表合并进 <higherPriorityPositions> 中去
     */
    const positions = self.fallbackTokenizer.match(
      content, codePoints, higherPriorityPositions, startOffset, endOffset)
    if (positions.length > 0) {
      higherPriorityPositions = removeIntersectPositions(
        mergeTwoOrderedPositions(higherPriorityPositions, positions))
    }
    return foldContainedPositions(higherPriorityPositions)
  }
}
