import { DataNode, DataNodeData, DataNodeType } from '../_types/data-node'
import { DataNodeMatchResult, DataNodeTokenPointDetail } from '../_types/token'
import {
  DataNodeTokenizer,
  DataNodeTokenizerConstructor,
  DataNodeTokenizerConstructorParams,
} from '../_types/tokenizer'
import { DataNodeTokenizerContext } from '../_types/tokenizer-context'


/**
 * 块状数据节点的类型
 * Type of BlockDataNode
 */
export type BlockDataNodeType = DataNodeType & string


/**
 * 块状数据节点的数据
 * Data of BlockDataNode
 */
export interface BlockDataNodeData extends DataNodeData {

}


/**
 * 块状数据节点
 */
export interface BlockDataNode<
  T extends BlockDataNodeType = BlockDataNodeType,
  D extends BlockDataNodeData = BlockDataNodeData,
  > extends DataNode<T, D> {

}


/**
 * 块数据节点匹配信息
 * Matched result of BlockDataNode
 */
export interface BlockDataNodeMatchResult<T extends DataNodeType = DataNodeType>
  extends DataNodeMatchResult<T> {
}


/**
 * 块数据的 eating 状态
 */
export interface BlockDataNodeEatingState<T extends DataNodeType = DataNodeType> {
  /**
   * 块数据类型
   */
  type: T
  /**
   * 是否处于开放（可修改）状态
   * @see https://github.github.com/gfm/#phase-1-block-structure
   */
  opening: boolean
  /**
   * 子块数据
   */
  children?:  BlockDataNodeEatingState[]
}


/**
 * 块状数据节点的词法分析器
 * Lexical analyzer for BlockDataNodes
 */
export interface BlockDataNodeTokenizer<
  T extends BlockDataNodeType = BlockDataNodeType,
  ES extends BlockDataNodeEatingState<T> = BlockDataNodeEatingState<T>,
  MR extends BlockDataNodeMatchResult<T> = BlockDataNodeMatchResult<T>,
  > extends DataNodeTokenizer<T, MR> {
  /**
   *
   * @returns [next index, matched Marker]
   */
  eatMarker: (
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    parent: BlockDataNodeEatingState,
  ) => [number, ES | null]

  /**
   *
   * @returns [next index, matched success]
   */
  eatContinuationText: (
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    state: ES,
  ) => [number, boolean]

  /**
   *
   * @returns [next index, matched success]
   */
  eatLazyContinuationText?: (
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    state: ES,
  ) => [number, boolean]

  /**
   * 在状态置为关闭时触发，执行一些清理操作
   */
  onStateClosed?: (state: ES) => void
}

/**
 * 块状数据节点的分词器的构造函数的参数
 * Params for BlockDataNodeTokenizerConstructor
 */
export interface BlockDataNodeTokenizerConstructorParams<
  T extends BlockDataNodeType = BlockDataNodeType,
  > extends DataNodeTokenizerConstructorParams<T> {

}


/**
 * 块状数据词法分析器的构造类接口
 * Constructor of BlockDataNodeTokenizer
 */
export interface BlockDataNodeTokenizerConstructor<
  T extends BlockDataNodeType = BlockDataNodeType,
  DT extends BlockDataNodeTokenizer<T> = BlockDataNodeTokenizer<T>,
  > extends DataNodeTokenizerConstructor<T, BlockDataNodeTokenizer<T>> {
  new(params: DataNodeTokenizerConstructorParams<T>): DT
}


/**
 * 块状数据节点的词法分析器的上下文
 * Context of BlockDataNodeTokenizer
 */
export interface BlockDataNodeTokenizerContext<
  T extends BlockDataNodeType = BlockDataNodeType,
  DT extends BlockDataNodeTokenizer<T> = BlockDataNodeTokenizer<T>,
  MR extends BlockDataNodeMatchResult<T> = BlockDataNodeMatchResult<T>,
  > extends DataNodeTokenizerContext<T, DT, MR> {

}
