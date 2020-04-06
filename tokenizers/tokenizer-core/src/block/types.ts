import { DataNode, DataNodeData, DataNodeType } from '../_types/data-node'
import { DataNodeTokenPointDetail, DataNodeTokenPosition } from '../_types/token'
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
 * 块数据节点在资源文件中的位置信息
 * DataNodeToken location information in the resource file
 */
export interface BlockDataNodeTokenPosition<T extends DataNodeType = DataNodeType>
  extends DataNodeTokenPosition<T> {
}


/**
 * 块状数据节点的词法分析器
 * Lexical analyzer for BlockDataNodes
 */
export interface BlockDataNodeTokenizer<
  T extends BlockDataNodeType = BlockDataNodeType,
  DTP extends BlockDataNodeTokenPosition<T> = BlockDataNodeTokenPosition<T>,
  > extends DataNodeTokenizer<T, DTP> {
  /**
   * 匹配指定区间的内容
   * @param content       待匹配的内容
   * @param codePoints    unicode 的编码及行列位置信息列表
   * @param startOffset   待匹配的子串的起始位置
   * @param endOffset     待匹配的子串的终止位置
   */
  match(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startOffset: number,
    endOffset: number,
  ): DTP[]
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
  DTP extends BlockDataNodeTokenPosition<T> = BlockDataNodeTokenPosition<T>,
  > extends DataNodeTokenizerContext<T, DT, DTP> {

}
