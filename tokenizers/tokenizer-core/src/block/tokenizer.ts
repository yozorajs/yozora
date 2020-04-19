import { DataNodeTokenPointDetail } from '../_types/token'
import { InlineDataNodeParseFunc } from '../inline/types'
import {
  BlockDataNode,
  BlockDataNodeData,
  BlockDataNodeEatingLineInfo,
  BlockDataNodeEatingResult,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
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
  MS extends BlockDataNodeMatchState<T> = BlockDataNodeMatchState<T>,
  MR extends BlockDataNodeMatchResult<T> = BlockDataNodeMatchResult<T>,
  > implements BlockDataNodeTokenizer<T, D, MS, MR>  {
  public abstract readonly name: string
  public abstract readonly recognizedTypes: T[]
  public readonly priority: number
  public readonly subTokenizers: BlockDataNodeTokenizer[] = []

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
  public useSubTokenizer(tokenizer: BlockDataNodeTokenizer): this {
    this.subTokenizers.push(tokenizer)
    return this
  }

  /**
   * override
   */
  public abstract eatNewMarker(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    parentState: BlockDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, MS> | null

  /**
   * override
   */
  public abstract eatContinuationText(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    state: MS,
  ): BlockDataNodeEatingResult<T, MS> | null

  /**
   * override
   */
  public abstract match(
    state: MS,
    children: BlockDataNodeMatchResult[],
  ): MR

  /**
   * override
   */
  public abstract parse(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: MR,
    children?: BlockDataNode[],
    parseInline?: InlineDataNodeParseFunc,
  ): BlockDataNode<T, D>
}
