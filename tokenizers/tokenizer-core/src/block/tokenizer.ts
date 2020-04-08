import { DataNodeTokenPointDetail } from '../_types/token'
import {
  BlockDataNode,
  BlockDataNodeData,
  BlockDataNodeMatchState,
  BlockDataNodeMatchResult,
  BlockDataNodeTokenizer,
  BlockDataNodeTokenizerConstructorParams,
  BlockDataNodeType,
} from './types'
import { InlineDataNodeTokenizerContext } from '../inline/types'


/**
 * 块状数据的词法分析器的抽象类
 */
export abstract class BaseBlockDataNodeTokenizer<
  T extends BlockDataNodeType,
  D extends BlockDataNodeData,
  MS extends BlockDataNodeMatchState<T> = BlockDataNodeMatchState<T>,
  MR extends BlockDataNodeMatchResult<T> = BlockDataNodeMatchResult<T>,
  > implements BlockDataNodeTokenizer<T, D, MS, MR>  {
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
  public abstract eatMarker(
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    parent: BlockDataNodeMatchState,
  ): [number, MS | null]

  /**
   * override
   */
  public abstract eatContinuationText(
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    state: MS,
  ): [number, boolean]

  /**
   * override
   */
  public abstract parse: (
    codePoints: DataNodeTokenPointDetail[],
    matchResult: MR,
    children?: BlockDataNode[],
    parseInline?: InlineDataNodeTokenizerContext['parse'],
  ) => BlockDataNode<T, D>

  /**
   *
   * @param content
   * @param codePoints
   * @param tokenPosition
   * @param children
   */
  protected abstract parseData(
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: MR,
    children?: BlockDataNode[]
  ): D
}
