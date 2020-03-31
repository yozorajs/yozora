import { DataNode, DataNodeType } from './types/data-node'
import { DataNodeTokenPointDetail, DataNodeTokenPosition } from './types/token'
import { InlineDataNodeTokenizer } from './types/tokenizer'
import {
  DataNodeTokenizerContext,
  InlineDataNodeTokenizerConstructor,
} from './types/tokenizer-context'
import {
  removeIntersectPositions,
  foldContainedPositions,
  mergeLowerPriorityPositions,
  mergeTwoOrderedPositions,
} from './util/position'


/**
 * 内联数据的分词器的上下文
 */
export class BaseInlineDataNodeTokenizerContext
  implements DataNodeTokenizerContext {
  protected readonly tokenizers: InlineDataNodeTokenizer[]
  protected readonly tokenizerMap: Map<DataNodeType, InlineDataNodeTokenizer>
  protected readonly fallbackTokenizer: InlineDataNodeTokenizer

  public constructor(
    FallbackTokenizerConstructor: InlineDataNodeTokenizerConstructor,
  ) {
    const fallbackTokenizer = new FallbackTokenizerConstructor(this, -1, '__inline_fallback__')
    this.tokenizers = []
    this.tokenizerMap = new Map()
    this.fallbackTokenizer = fallbackTokenizer
    for (const t of fallbackTokenizer.recognizedTypes) {
      this.tokenizerMap.set(t, fallbackTokenizer)
    }
  }

  /**
   * override
   */
  public useTokenizer(
    priority: number,
    TokenizerConstructor: InlineDataNodeTokenizerConstructor,
    name?: string,
  ): this {
    const self = this
    const tokenizer: InlineDataNodeTokenizer =
      new TokenizerConstructor!(self, priority, name)
    self.tokenizers.push(tokenizer)
    self.tokenizers.sort((x, y) => y.priority - x.priority)
    for (const t of tokenizer.recognizedTypes) {
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
  ): DataNodeTokenPosition[] {
    const self = this
    return self.deepMatch(content, codePoints, [], startOffset, endOffset, 0)
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
  ): DataNode[] {
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
    return self.deepParse(content, codePoints, tokenPositions)
  }

  protected deepParse(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPositions: DataNodeTokenPosition[],
  ): DataNode[] {
    const self = this
    const results: DataNode[] = []
    for (const p of tokenPositions) {
      const tokenizer = self.tokenizerMap.get(p.type)
      if (tokenizer == null) continue

      let children: DataNode[] | undefined
      if (p.children != null && p.children.length > 0) {
        children = self.deepParse(content, codePoints,
          p.children as DataNodeTokenPosition[])
      }
      const result: DataNode = tokenizer.parse(content, codePoints, p, children)
      results.push(result as DataNode)
    }
    return results
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
    innerAtomPositions: DataNodeTokenPosition[],
    startOffset: number,
    endOffset: number,
    tokenizerStartIndex: number,
  ): DataNodeTokenPosition[] {
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
