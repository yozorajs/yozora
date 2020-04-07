import { CodePoint } from '../_constant/character'
import { DataNodePoint } from '../_types/data-node'
import { DataNodeTokenPointDetail } from '../_types/token'
import {
  InlineDataNode,
  InlineDataNodeData,
  InlineDataNodeMatchResult,
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
  MR extends InlineDataNodeMatchResult<T>,
  EatingState,
  > implements InlineDataNodeTokenizer<T>  {
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
    innerAtomPositions: InlineDataNodeMatchResult[],
    startIndex: number,
    endIndex: number,
  ): MR[] {
    if (startIndex >= endIndex) return []

    const self = this
    const result: MR[] = []
    const state: EatingState = {} as any

    // initialize state
    if (self.initializeEatingState != null) {
      self.initializeEatingState(state)
    }

    let i = startIndex
    let precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null = null
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
        i > startIndex ? codePoints[i - 1].codePoint : undefined,
        itp.left.start < endIndex ? codePoints[itp.left.start].codePoint : undefined,
      )
      i = itp.right.end
      precedingTokenPosition = itp
    }

    if (i < endIndex) {
      self.eatTo(
        content,
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
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: MR,
    children?: InlineDataNode[]
  ): InlineDataNode {
    const start: DataNodeTokenPointDetail = codePoints[tokenPosition.left.start]
    const end: DataNodePoint = codePoints[tokenPosition.right.end]
    const data = this.parseData(content, codePoints, tokenPosition, children)
    return {
      type: tokenPosition.type,
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
    }
  }

  /**
   *
   * @param content
   * @param codePoints
   * @param tokenPosition
   * @param children
   */
  protected abstract parseData(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: MR,
    children?: InlineDataNode[]
  ): D

  /**
   * 用于在 match 函数中回调，在过滤掉所有内部优先级更高的位置的前提下
   * 执行匹配操作
   *
   * @param content                 待匹配的内容
   * @param codePoints              待匹配的内容的 unicode 编码信息
   * @param precedingTokenPosition  匹配的起始位置之前的最近数据节点位置信息
   * @param state                   eatTo 函数的状态
   * @param startIndex             起始的偏移位置
   * @param endIndex               结束的偏移位置
   * @param result                  所有匹配到的左右边界的集合
   * @param precededCharacter       待匹配内容的前一个字符（仅用于边界判断）
   * @param followedCharacter       待匹配内容的后一个字符（仅用于边界判断）
   */
  protected abstract eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: EatingState,
    startIndex: number,
    endIndex: number,
    result: InlineDataNodeMatchResult<T>[],
    precededCharacter?: CodePoint,
    followedCharacter?: CodePoint,
  ): void

  /**
   * 初始化 EatToState
   * @param state
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected initializeEatingState(state: EatingState): void { }
}
