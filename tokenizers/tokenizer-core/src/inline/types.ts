import { DataNode, DataNodeData, DataNodeType } from '../_types/data-node'
import { DataNodeTokenPointDetail, DataNodeTokenPosition } from '../_types/token'
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
 * 内联数据节点的词法分析器
 * Lexical analyzer for InlineDataNodes
 */
export interface InlineDataNodeTokenizer<
  T extends InlineDataNodeType = InlineDataNodeType,
  > extends DataNodeTokenizer<T> {
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
    innerAtomPositions: DataNodeTokenPosition[],
    startOffset: number,
    endOffset: number,
  ): DataNodeTokenPosition<T>[]
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
  > extends DataNodeTokenizerContext<T, DT> {

}
