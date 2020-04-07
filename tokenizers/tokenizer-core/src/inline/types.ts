import { DataNode, DataNodeData, DataNodeType } from '../_types/data-node'
import {
  DataNodeTokenFlanking,
  DataNodeTokenPointDetail,
  DataNodeTokenPosition,
  DataNodeMatchResult,
} from '../_types/token'
import {
  DataNodeTokenizer,
  DataNodeTokenizerConstructor,
  DataNodeTokenizerConstructorParams,
} from '../_types/tokenizer'
import { DataNodeTokenizerContext } from '../_types/tokenizer-context'


/**
 * 内联数据节点的类型
 * Type of InlineDataNode
 */
export type InlineDataNodeType = DataNodeType & string


/**
 * 内联数据节点的数据
 * Data of InlineDataNode
 */
export interface InlineDataNodeData extends DataNodeData {

}


/**
 * 内联数据节点
 */
export interface InlineDataNode<
  T extends InlineDataNodeType = InlineDataNodeType,
  D extends InlineDataNodeData = InlineDataNodeData,
  > extends DataNode<T, D> {

}


/**
 * 内联数据节点匹配信息
 * Matched result of InlineDataNode
 */
export interface InlineDataNodeMatchResult<T extends DataNodeType = DataNodeType>
  extends DataNodeMatchResult<T>, DataNodeTokenPosition<T> {
  /**
   * 数据节点内部的节点位置信息
   * Inner TokenDataNode location information
   */
  children: InlineDataNodeMatchResult[]
  /**
   * 辅助属性：数据节点内部未被深入解析的内容段
   * Auxiliary attribute: content pieces that is not deeply parsed inside the TokenData node
   */
  _unExcavatedContentPieces?: Pick<DataNodeTokenFlanking, 'start' | 'end'>[]
  /**
   * 辅助属性：children 中不接受的节点类型，若出现，则说明当前节点是个无效
   * Auxiliary attribute: The DataNodeTypes that are not accepted in children.
   *                      If it is not null/undefined, means that the current
   *                      TokenDataNode is invalid
   */
  _unAcceptableChildTypes?: DataNodeType[]
}


/**
 * 内联数据节点的词法分析器
 * Lexical analyzer for InlineDataNodes
 */
export interface InlineDataNodeTokenizer<
  T extends InlineDataNodeType = InlineDataNodeType,
  MR extends InlineDataNodeMatchResult<T> = InlineDataNodeMatchResult<T>,
  > extends DataNodeTokenizer<T> {
  /**
   * 匹配指定区间的内容
   * @param content       待匹配的内容
   * @param codePoints    unicode 的编码及行列位置信息列表
   * @param innerTokens   内部的数据节点列表
   * @param startIndex    待匹配的子串的起始位置
   * @param endIndex      待匹配的子串的终止位置
   */
  match(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    innerAtomPositions: MR[],
    startIndex: number,
    endIndex: number,
  ): MR[]

  /**
   * 解析匹配到的内容
   * @param content       待匹配的内容
   * @param codePoints    unicode 的编码及行列位置信息列表
   * @param matches       <match> 函数匹配到的内容
   * @param children      子元素内容
   */
  parse(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    matches: MR,
    children?: DataNode[]
  ): DataNode
}


/**
 * 内联数据节点的分词器的构造函数的参数
 * Params for InlineDataNodeTokenizerConstructor
 */
export interface InlineDataNodeTokenizerConstructorParams<
  T extends InlineDataNodeType = InlineDataNodeType,
  > extends DataNodeTokenizerConstructorParams<T> {

}


/**
 * 内联数据词法分析器的构造类接口
 * Constructor of InlineDataNodeTokenizer
 */
export interface InlineDataNodeTokenizerConstructor<
  T extends InlineDataNodeType = InlineDataNodeType,
  DT extends InlineDataNodeTokenizer<T> = InlineDataNodeTokenizer<T>,
  > extends DataNodeTokenizerConstructor<T, InlineDataNodeTokenizer<T>> {
  new(params: DataNodeTokenizerConstructorParams<T>): DT
}


/**
 * 内联数据节点的词法分析器的上下文
 * Context of InlineDataNodeTokenizer
 */
export interface InlineDataNodeTokenizerContext<
  T extends InlineDataNodeType = InlineDataNodeType,
  DT extends InlineDataNodeTokenizer<T> = InlineDataNodeTokenizer<T>,
  MR extends InlineDataNodeMatchResult<T> = InlineDataNodeMatchResult<T>,
  > extends DataNodeTokenizerContext<T, DT, MR> {

}
