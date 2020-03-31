import { DataNodeType, DataNode } from './data-node'
import { DataNodeTokenPointDetail, DataNodeTokenPosition } from './token'
import { DataNodeTokenizer, InlineDataNodeTokenizer } from './tokenizer'


/**
 * 数据节点的词法分析器的上下文
 * DataNodeTokenizer context
 */
export interface DataNodeTokenizerContext<T extends DataNodeType = DataNodeType> {
  /**
   * 向词法分析器上下文中注册词法分析器
   * Register a DataNodeTokenizer in the context
   * @param priority              词法分词器的优先级
   * @param TokenizerConstructor  词法解析器的构造函数
   * @param name                  词法分析器的名称，用于方便调试
   */
  useTokenizer(
    priority: number,
    TokenizerConstructor: DataNodeTokenizerConstructor<T>,
    name?: string,
  ): this

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
    startOffset: number,
    endOffset: number,
  ): DataNodeTokenPosition<T>[]

  /**
   * 解析匹配到的内容
   * @param content         待解析的内容
   * @param codePoints      unicode 的编码及行列位置信息列表
   * @param tokenPositions  解析到的内容
   * @param startOffset     待匹配的子串的起始位置
   * @param endOffset       待匹配的子串的终止位置
   */
  parse(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPositions: DataNodeTokenPosition<T>[],
    startOffset: number,
    endOffset: number,
  ): DataNode[]
}


/**
 * 词法解析器的构造类接口
 * Constructor of DataNodeTokenizer
 */
export interface DataNodeTokenizerConstructor<T extends DataNodeType = DataNodeType> {
  new(
    context: DataNodeTokenizerContext<T>,
    priority: number, name?: string
  ): DataNodeTokenizer<T>
}


/**
 * 内敛数据词法解析器的构造类接口
 * Constructor of InlineDataNodeTokenizer
 */
export interface InlineDataNodeTokenizerConstructor<T extends DataNodeType = DataNodeType> {
  new(
    context: DataNodeTokenizerContext<T>,
    priority: number, name?: string
  ): InlineDataNodeTokenizer<T>
}
