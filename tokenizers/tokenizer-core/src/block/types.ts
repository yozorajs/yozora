import { DataNode, DataNodeData, DataNodeType } from '../_types/data-node'
import { DataNodeTokenPointDetail } from '../_types/token'
import {
  DataNodeTokenizer,
  DataNodeTokenizerConstructor,
  DataNodeTokenizerConstructorParams,
} from '../_types/tokenizer'
import { DataNodeTokenizerContext } from '../_types/tokenizer-context'
import { InlineDataNodeParseFunc } from '../inline/types'


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
 * 块状数据节点 / 解析结果
 * BlockDataNode / BlockDataNodeParseResult
 */
export interface BlockDataNode<
  T extends BlockDataNodeType = BlockDataNodeType,
  D extends BlockDataNodeData = BlockDataNodeData,
  > extends DataNode<T, D> {

}


/**
 * 块数据匹配过程的状态，即匹配过程的中间数据
 */
export interface BlockDataNodeMatchState<
  T extends BlockDataNodeType = BlockDataNodeType,
  > {
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
  children?: BlockDataNodeMatchState[]
}


/**
 * 块状数据匹配到的结果
 */
export interface BlockDataNodeMatchResult<
  T extends BlockDataNodeType = BlockDataNodeType,
  > {
  type: T
}


export interface BlockDataNodeTokenizer<
  T extends BlockDataNodeType = BlockDataNodeType,
  D extends BlockDataNodeData = BlockDataNodeData,
  MS extends BlockDataNodeMatchState<T> = BlockDataNodeMatchState<T>,
  MR extends BlockDataNodeMatchResult<T> = BlockDataNodeMatchResult<T>,
  > extends DataNodeTokenizer<T> {
  /**
   *
   * @returns [next index, matched Marker]
   */
  eatMarker: (
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    parentMatchState: BlockDataNodeMatchState,
  ) => [number, MS | null]

  /**
   *
   * @returns [next index, matched success]
   */
  eatContinuationText: (
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    matchState: MS,
  ) => [number, boolean]

  /**
   * @returns [next index, matched success]
   */
  eatLazyContinuationText?: (
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    matchState: MS,
  ) => [number, boolean]

  /**
   *
   */
  closeMatchState?: (matchState: MS) => void

  /**
   *
   */
  parse: (
    codePoints: DataNodeTokenPointDetail[],
    matchResult: MR,
    children?: BlockDataNode[],
    parseInline?: InlineDataNodeParseFunc,
  ) => BlockDataNode<T, D>
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
