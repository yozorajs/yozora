import { DataNodePoint } from '../_types/data-node'
import { DataNodeTokenPointDetail } from '../_types/token'
import {
  InlineDataNode,
  InlineDataNodeData,
  InlineDataNodeMatchResult,
  InlineDataNodeMatchState,
  InlineDataNodeTokenizer,
  InlineDataNodeTokenizerConstructorParams,
  InlineDataNodeType,
} from './types'


/**
 * 内联数据的词法分析器的抽象类
 */
export abstract class BaseInlineDataNodeTokenizer<
  T extends InlineDataNodeType,
  D extends InlineDataNodeData,
  MS extends InlineDataNodeMatchState = InlineDataNodeMatchState,
  MR extends InlineDataNodeMatchResult<T> = InlineDataNodeMatchResult<T>,
  PR extends InlineDataNode<T, D> = InlineDataNode<T, D>,
  > implements InlineDataNodeTokenizer<T, D, MR>  {
  public abstract readonly name: string
  public abstract readonly recognizedTypes: T[]
  public readonly priority: number

  public constructor(params: InlineDataNodeTokenizerConstructorParams) {
    const { name, priority, recognizedTypes } = params
    this.priority = priority

    // cover name and recognizedTypes if they specified
    const self = this as this & any
    if (name != null) self.name = name
    if (recognizedTypes != null && recognizedTypes.length > 0) {
      self.recognizedTypes = recognizedTypes
    }
  }

  /**
   * 抽象出 InlineDataTokenizer 的 <match> 函数的公共操作，使其无需关心
   *  <innerAtoms> 信息：
   *    - 将所有的 <innerAtom> 视作一个原子数据，并将原待匹配内容
   *      分割成若干段投喂到 <eatTo> 函数中，最后整合成完整的 <match> 返回结果；
   *    - 对上一步的结果按照 `<left.start, right.end>` 的顺序进行升序排序
   *
   * override
   */
  public match(
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    innerAtoms: InlineDataNodeMatchResult[],
  ): MR[] {
    if (startIndex >= endIndex) return []

    const self = this
    const result: MR[] = []
    const state: MS = {} as any

    // initialize state
    if (self.initializeMatchState!= null) {
      self.initializeMatchState(state)
    }

    let i = startIndex
    let precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null = null
    for (const itp of innerAtoms) {
      if (i >= itp.left.start) {
        i = Math.max(i, itp.right.end)
        continue
      }
      self.eatTo(
        codePoints,
        precedingTokenPosition,
        state,
        i,
        itp.left.start,
        result,
        i > startIndex ? codePoints[i - 1].codePoint : undefined,
        itp.left.start < endIndex ? codePoints[itp.left.start].codePoint : undefined,
      )
      i = itp.right.end
      precedingTokenPosition = itp
    }

    if (i < endIndex) {
      self.eatTo(
        codePoints,
        precedingTokenPosition,
        state,
        i,
        endIndex,
        result,
        i > startIndex ? codePoints[i - 1].codePoint : undefined,
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
   * override
   */
  public parse(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: MR,
    children?: InlineDataNode[]
  ): PR {
    const start: DataNodeTokenPointDetail = codePoints[matchResult.left.start]
    const end: DataNodePoint = codePoints[matchResult.right.end]
    const data = this.parseData(codePoints, matchResult, children)
    return {
      type: matchResult.type,
      position: {
        start: {
          line: start.line,
          column: start.column,
          offset: start.offset,
        },
        end: {
          line: end.line,
          column: end.column,
          offset: end.offset,
        },
      },
      data,
    } as PR
  }

  /**
   *
   * @param content
   * @param codePoints
   * @param matchResult
   * @param children
   */
  protected abstract parseData(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: MR,
    children?: InlineDataNode[]
  ): D

  /**
   * 用于在 match 函数中回调，在过滤掉所有内部优先级更高的位置的前提下
   * 执行匹配操作
   *
   * @param codePoints              待匹配的内容的 unicode 编码信息
   * @param precedingTokenPosition  匹配的起始位置之前的最近数据节点位置信息
   * @param state                   eatTo 函数的状态
   * @param startIndex              起始的偏移位置
   * @param endIndex                结束的偏移位置
   * @param result                  所有匹配到的左右边界的集合
   * @param precededCharacter       待匹配内容的前一个字符（仅用于边界判断）
   * @param followedCharacter       待匹配内容的后一个字符（仅用于边界判断）
   */
  protected abstract eatTo(
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: MS,
    startIndex: number,
    endIndex: number,
    result: InlineDataNodeMatchResult<T>[],
    precededCharacter?: number,
    followedCharacter?: number,
  ): void

  /**
   * 初始化 MatchState
   * @param state
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected initializeMatchState(state: MS): void { }
}
