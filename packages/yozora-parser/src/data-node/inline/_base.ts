import {
  InlineDataNodeType,
  DataNodeTokenFlankingGraph,
  DataNodeTokenPoint,
  DataNodeTokenFlankingAssemblyGraphEdge,
} from '@yozora/core'
import { InlineDataNodeTokenizer, DataNodeTokenizerContext } from '../types'


/**
 * 内联数据的词法分析器的抽象类
 */
export abstract class BaseInlineDataNodeTokenizer<T extends InlineDataNodeType>
  implements InlineDataNodeTokenizer<T>  {
  public abstract readonly type: T
  public readonly priority: number
  protected readonly context: DataNodeTokenizerContext
  protected _currentContent!: string
  protected _currentCodePoints!: number[]

  public constructor(context: DataNodeTokenizerContext, priority: number) {
    this.context = context
    this.priority = priority
  }

  public abstract match(content: string, codePoints: number[]): DataNodeTokenFlankingGraph<T>

  public checkCandidatePartialMatches(
    content: string,
    codePoints: number[],
    points: DataNodeTokenPoint[],
    matches: DataNodeTokenFlankingAssemblyGraphEdge<T>,
    innerMatches?: DataNodeTokenFlankingAssemblyGraphEdge<T>[],
  ): boolean {
    if (innerMatches == null || innerMatches.length <= 0) return true
    const self = this
    for (const im of innerMatches) {
      if (im.type === self.type) return false
    }
    return true
  }
    content: string,
    codePoints: number[],
    points: DataNodeTokenPoint[],
    matches: DataNodeTokenFlankingAssemblyGraphEdge<T>,
    innerMatches?: DataNodeTokenFlankingAssemblyGraphEdge<T>[],
  ): boolean

  /**
   * Do some initialization before executing the match function:
   *  - update _currentContent and _currentCodePoints.
   *
   * @param content
   * @param codePoints
   */
  protected initBeforeMatch(content: string, codePoints: number[]): void {
    const self = this
    self._currentContent = content
    self._currentCodePoints = codePoints
  }
}
