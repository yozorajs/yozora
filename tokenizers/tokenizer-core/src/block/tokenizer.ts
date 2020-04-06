import { DataNodePoint } from '../_types/data-node'
import { DataNodeTokenPointDetail } from '../_types/token'
import {
  BlockDataNode,
  BlockDataNodeData,
  BlockDataNodeTokenPosition,
  BlockDataNodeTokenizer,
  BlockDataNodeTokenizerConstructorParams,
  BlockDataNodeType,
} from './types'


/**
 * 块状数据的词法分析器的抽象类
 */
export abstract class BaseBlockDataNodeTokenizer<
  T extends BlockDataNodeType,
  D extends BlockDataNodeData,
  MR extends BlockDataNodeTokenPosition<T>,
  > implements BlockDataNodeTokenizer<T>  {
  public abstract readonly name: string
  public abstract readonly recognizedTypes: T[]
  public readonly priority: number

  public constructor(params: BlockDataNodeTokenizerConstructorParams) {
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
   * override
   */
  public abstract match(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startOffset: number,
    endOffset: number,
  ): MR[]

  /**
   * override
   */
  public parse(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: MR,
    children?: BlockDataNode[]
  ): BlockDataNode {
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
    children?: BlockDataNode[]
  ): D
}
