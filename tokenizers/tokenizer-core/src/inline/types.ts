import { DataNode, DataNodeData, DataNodeType } from '../_types/data-node'
import {
  DataNodeTokenFlanking,
  DataNodeTokenPointDetail,
  DataNodeTokenPosition,
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
 * 内联数据节点在资源文件中的位置信息
 * DataNodeToken location information in the resource file
 */
export interface InlineDataNodeTokenPosition<T extends DataNodeType = DataNodeType>
  extends DataNodeTokenPosition<T> {
  /**
   * 数据节点内部的节点位置信息
   * Inner TokenDataNode location information
   */
  children: InlineDataNodeTokenPosition[]
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
  DTP extends InlineDataNodeTokenPosition<T> = InlineDataNodeTokenPosition<T>,
  > extends DataNodeTokenizer<T, DTP> {
  /**
   * 匹配指定区间的内容
   * @param content       待匹配的内容
   * @param codePoints    unicode 的编码及行列位置信息列表
   * @param innerTokens   内部的数据节点列表
   * @param startOffset   待匹配的子串的起始位置
   * @param endOffset     待匹配的子串的终止位置
   */
  match(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    innerAtomPositions: DTP[],
    startOffset: number,
    endOffset: number,
  ): DTP[]
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
  DTP extends InlineDataNodeTokenPosition<T> = InlineDataNodeTokenPosition<T>,
  > extends DataNodeTokenizerContext<T, DT, DTP> {

}
