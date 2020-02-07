import {
  BlockDataNode,
  InlineDataNode,
  DataNodeTokenFlankingGraph,
  InlineDataNodeType,
  BlockDataNodeType,
  mergeFlankingGraph,
  DataNodeTokenFlankingAssemblyGraphEdge,
} from '@yozora/core'
import {
  DataNodeTokenizerContext,
  BlockDataNodeTokenizer,
  BlockDataNodeTokenizerConstructor,
  InlineDataNodeTokenizerConstructor,
  InlineDataNodeTokenizer,
  Mediator,
} from '../types'


export class InlineDataNodeParser implements DataNodeTokenizerContext {
  protected readonly mediator: Mediator
  protected readonly blockDataTokenizerMap: Map<BlockDataNodeType, BlockDataNodeTokenizer>
  protected readonly inlineDataTokenizerMap: Map<InlineDataNodeType, InlineDataNodeTokenizer>

  public constructor(mediator: Mediator) {
    this.mediator = mediator
    this.blockDataTokenizerMap = new Map()
    this.inlineDataTokenizerMap = new Map()
  }

  /**
   * @override
   */
  public useBlockDataTokenizer(
    tokenizerOrPriority: BlockDataNodeTokenizer | number,
    TokenizerConstructor?: BlockDataNodeTokenizerConstructor,
  ): this {
    const self = this
    const tokenizer: BlockDataNodeTokenizer = (typeof tokenizerOrPriority === 'number')
      ? new TokenizerConstructor!(self, tokenizerOrPriority)
      : tokenizerOrPriority as BlockDataNodeTokenizer
    self.blockDataTokenizerMap.set(tokenizer.type, tokenizer)
    return self
  }

  /**
   * @override
   */
  public useInlineDataTokenizer(
    tokenizerOrPriority: InlineDataNodeTokenizer | number,
    TokenizerConstructor?: InlineDataNodeTokenizerConstructor,
  ): this {
    const self = this
    const tokenizer: InlineDataNodeTokenizer = (typeof tokenizerOrPriority === 'number')
      ? new TokenizerConstructor!(self, tokenizerOrPriority)
      : tokenizerOrPriority as InlineDataNodeTokenizer
    self.inlineDataTokenizerMap.set(tokenizer.type, tokenizer)
    return self
  }

  /**
   * @override
   */
  public parseBlockData(content: string, codePoints: number[]): BlockDataNode[] {
    const self = this
    const graphs: DataNodeTokenFlankingGraph<BlockDataNodeType>[] = []
    for (const tokenizer of self.blockDataTokenizerMap.values()) {
      const g = tokenizer.match(content, codePoints)
      graphs.push(g)
    }
    return []
  }

  /**
   * @override
   */
  public parseInlineData(content: string, codePoints: number[]): InlineDataNode[] {
    const self = this
    const graphs: DataNodeTokenFlankingGraph<InlineDataNodeType>[] = []
    for (const tokenizer of self.inlineDataTokenizerMap.values()) {
      const g = tokenizer.match(content, codePoints)
      graphs.push(g)
    }
    const ag = mergeFlankingGraph(graphs)
    for (let i = 0, j; i < ag.edges.length;) {
      let e = ag.edges[i]
      if (e.state !== 'pending') {
        ++i
        continue
      }

      for (j = i + 1; j < ag.edges.length; ++j) {
        const e2 = ag.edges[j]
        if (e2.from >= e.to) break
        if (self.mediator.checkPriority(ag, e, e2) < 0) {
          e = e2
        }
      }

      const innerMatches: DataNodeTokenFlankingAssemblyGraphEdge<InlineDataNodeType>[] = []
      for (let k = i; k < j; ++k) {
        const e2 = ag.edges[k]
        if (e2.state === 'rejected' || e === e2) continue
        if (e2.from >= e.from && e2.to <= e.to) innerMatches.push(e2)
      }
      const tokenizer = self.inlineDataTokenizerMap.get(e.type)!

      // 如果该区间非法，则继续寻找优先级高的区间
      if (tokenizer.checkCandidatePartialMatches(content, codePoints, ag.points, e, innerMatches)) {
        e.state = 'rejected'
        continue
      }

      // 否则，执行解析操作，并杀死与其有交叠（或内含的）且其状态为 pending 的区间
      const dataNodes = tokenizer.parse(content, codePoints, ag.points, e, innerMatches)
      e.data = dataNodes
      e.state = 'accepted'
      for (let k = i; k < j; ++k) {
        const e2 = ag.edges[k]
        if (e2.state !== 'pending') continue
        if (e2.to <= e.from || e2.from >= e.to) continue

        // 杀死左侧有交叠的区间
        if (e2.from < e.from && e2.to < e.to) {
          e2.state = 'rejected'
          continue
        }

        // 杀死内含的区间
        if (e2.from >= e.from && e2.to <= e.to) {
          e2.state = 'rejected'
          continue
        }

        // 杀死右侧有交叠的区间
        if (e2.from > e.from && e2.to > e.to) {
          e2.state = 'rejected'
          continue
        }
      }
    }
    return []
  }
}
