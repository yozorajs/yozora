import { DataNode, DataNodeData, DataNodeType } from '../_types/data-node'
import { DataNodeMatchResult, DataNodeTokenPointDetail } from '../_types/token'
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


export interface BlockDataNodeEatingLineInfo {
  /**
   * 当前行剩余内容起始的下标
   * The starting index of the rest of the current line
   */
  startIndex: number
  /**
   * 当前行结束的下标
   * The ending index of the rest of the current line
   */
  endIndex: number
  /**
   * 当前行剩余内容第一个非空白字符的下标
   * The index of first non-blank character in the rest of the current line
   */
  firstNonWhiteSpaceIndex: number
  /**
   * 当前行剩余内容是否为空行
   * Whether the remaining content of the current line is blank
   */
  isBlankLine: boolean
}


/**
 * 块数据匹配过程的状态，即匹配过程的中间数据
 * The state of the block data matching process,
 * that is, the intermediate data in the matching process
 */
export interface BlockDataNodeMatchState<
  T extends BlockDataNodeType = BlockDataNodeType,
  > {
  /**
   * 块数据类型
   * type of BlockDataNode
   */
  type: T
  /**
   * 是否处于开放（可修改）状态
   * Is it in an opening (modifiable) state
   * @see https://github.github.com/gfm/#phase-1-block-structure
   */
  opening: boolean
  /**
   * 子块数据
   * Sub-blocks' BlockDataNodeMatchState
   */
  children?: BlockDataNodeMatchState[]
}


/**
 * 块状数据匹配到的结果
 * The result of matching the block data
 */
export interface BlockDataNodeMatchResult<T extends BlockDataNodeType = BlockDataNodeType>
  extends DataNodeMatchResult<T> {
  children?: BlockDataNodeMatchResult[]
}


export interface BlockDataNodeTokenizer<
  T extends BlockDataNodeType = BlockDataNodeType,
  D extends BlockDataNodeData = BlockDataNodeData,
  MS extends BlockDataNodeMatchState<T> = BlockDataNodeMatchState<T>,
  MR extends BlockDataNodeMatchResult<T> = BlockDataNodeMatchResult<T>,
  > extends DataNodeTokenizer<T> {
  /**
   * 尝试匹配新的块数据；
   * 返回的数据中，nextIndex 仅当 BlockDataNodeMatchResult 非空时有效
   * Try to match new block data.
   * In the returned data, nextIndex is only valid when BlockDataNodeMatchResult
   * is not null/undefined.
   *
   * @param codePoints
   * @param eatingLineInfo
   * @param parentMatchState
   * @returns [nextIndex, BlockDataNodeMatchResult]
   * @see https://github.github.com/gfm/#phase-1-block-structure step2
   */
  eatMarker(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    parentMatchState: BlockDataNodeMatchState,
  ): [number, MS | null]
  /**
   * 尝试继续匹配延续文本，判断其是否仍处于 opening 状态；
   * 返回的数据中，nextIndex 仅当 isMatched 为 true 时有效
   * Try to eat the Continuation Text, and check if it is still satisfied
   * to current opening MatchState, if matches, append to the previous
   * matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param codePoints
   * @param eatingLineInfo
   * @param matchState
   * @returns [nextIndex, isMatched]
   * @see https://github.github.com/gfm/#phase-1-block-structure step1
   */
  eatContinuationText(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    matchState: MS,
  ): [number, boolean]

  /**
   * 尝试继续匹配 Laziness 延续文本，判断其是否仍处于 opening 状态；
   * 返回的数据中，nextIndex 仅当 isMatched 为 true 时有效
   * Try to eat the Laziness Continuation Text, and check if it is still
   * satisfied to current opening MatchState, if matches, append to the
   * previous matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param codePoints
   * @param eatingLineInfo
   * @param matchState
   * @returns [nextIndex, isMatched]
   * @see https://github.github.com/gfm/#phase-1-block-structure step3
   */
  eatLazyContinuationText?(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    matchState: MS,
  ): [number, boolean]

  /**
   * 在 MatchState 结束时被调用，可在此函数中执行一些善尾工作
   * Called when the MatchState is closed, you can perform some tail work here.
   * @param matchState
   */
  closeMatchState?(matchState: MS): void

  /**
   * Parse matchResult into block data
   * @param codePoints
   * @param matchResult
   * @param children
   * @param parseInline
   */
  parse(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: MR,
    children?: BlockDataNode[],
    parseInline?: InlineDataNodeParseFunc,
  ): BlockDataNode<T, D>
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
