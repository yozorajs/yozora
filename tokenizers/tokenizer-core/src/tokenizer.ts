import { CodePoint } from './constant/character'
import { DataNode, DataNodeData, DataNodePoint, DataNodeType } from './types/data-node'
import { DataNodeTokenPosition, DataNodeTokenPointDetail } from './types/token'
import { DataNodeTokenizerContext } from './types/tokenizer-context'
import { InlineDataNodeTokenizer, BlockDataNodeTokenizer } from './types/tokenizer'


/**
 * 内联数据的词法分析器的抽象类
 */
export abstract class BaseInlineDataNodeTokenizer<
  T extends DataNodeType,
  R extends DataNodeTokenPosition<T>,
  D extends DataNodeData,
  EatingState,
  > implements InlineDataNodeTokenizer<T>  {
  public abstract readonly name: string
  public abstract readonly recognizedTypes: T[]
  public readonly priority: number
  protected readonly context: DataNodeTokenizerContext<DataNodeType>

  public constructor(
    context: DataNodeTokenizerContext<DataNodeType>,
    priority: number,
    name?: string,
  ) {
    this.context = context
    this.priority = priority
    if (name != null) (this as any).name = name
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
    innerAtomPositions: DataNodeTokenPosition[],
    startOffset: number,
    endOffset: number,
  ): R[] {
    if (startOffset >= endOffset) return []

    const self = this
    const result: R[] = []
    const state: EatingState = {} as any

    // initialize state
    if (self.initializeEatingState != null) {
      self.initializeEatingState(state)
    }

    let i = startOffset
    let precedingTokenPosition: DataNodeTokenPosition<DataNodeType> | null = null
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
   * override
   */
  public parse(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: R,
    children?: DataNode[]
  ): DataNode<DataNodeType> {
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
    tokenPosition: R,
    children?: DataNode[]
  ): D

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
    precedingTokenPosition: DataNodeTokenPosition<DataNodeType> | null,
    state: EatingState,
    startOffset: number,
    endOffset: number,
    result: DataNodeTokenPosition<T>[],
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


/**
 * 块状数据的词法分析器的抽象类
 */
export abstract class BaseBlockDataNodeTokenizer<
  T extends DataNodeType,
  R extends DataNodeTokenPosition<T>,
  D extends DataNodeData,
  > implements BlockDataNodeTokenizer<T>  {
  public abstract readonly name: string
  public abstract readonly recognizedTypes: T[]
  public readonly priority: number
  protected readonly context: DataNodeTokenizerContext<DataNodeType>

  public constructor(
    context: DataNodeTokenizerContext<DataNodeType>,
    priority: number,
    name?: string,
  ) {
    this.context = context
    this.priority = priority
    if (name != null) (this as any).name = name
  }

  /**
   * override
   */
  public abstract match(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startOffset: number,
    endOffset: number,
  ): R[]

  /**
   * override
   */
  public parse(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: R,
    children?: DataNode[]
  ): DataNode<DataNodeType> {
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
    tokenPosition: R,
    children?: DataNode[]
  ): D
}
