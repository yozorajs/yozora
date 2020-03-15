import { DataNodeType } from '@yozora/core'
import { DataNodeTokenPointDetail, DataNodeTokenPosition } from './position'


/**
 * 数据节点的词法分析器
 * Lexical analyzer for DataNodes
 */
export interface DataNodeTokenizer<T extends DataNodeType> {
  /**
   * 词法分析器的优先级，数值越大，优先级越高
   * The priority of the tokenizer.
   * The larger the value, the higher the priority.
   */
  readonly priority: number

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
 * 数据节点的词法分析器的上下文
 * DataNodeTokenizer context
 */
export interface DataNodeTokenizerContext<T extends DataNodeType> {
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
    codePoints?: DataNodeTokenPointDetail[],
    startOffset?: number,
    endOffset?: number,
  ): DataNodeTokenPosition<T>[]
}


/**
 * 词法解析器的构造类接口
 * Constructor of DataNodeTokenizer
 */
export interface DataNodeTokenizerConstructor<T extends DataNodeType> {
  new(context: DataNodeTokenizerContext<T>, priority: number, name?: string): DataNodeTokenizer<T>
}
