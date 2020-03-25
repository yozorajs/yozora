import { DataNodeType, DataNode } from './data-node'
import { DataNodeTokenPointDetail, DataNodeTokenPosition } from './token'


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
   * 当前分词器可识别的数据节点类型
   * 用于在解析操作中，快速定位到 match 函数返回的数据中数据节点所对应的分词器
   */
  readonly recognizedTypes: T[]

  /**
   * 解析匹配到的内容
   * @param content       待匹配的内容
   * @param codePoints    unicode 的编码及行列位置信息列表
   * @param tokenPosition <match> 函数匹配到的内容
   * @param children      子元素内容
   */
  parse(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: DataNodeTokenPosition<T>,
    children?: DataNode[]
  ): DataNode
}


/**
 * 数据节点的词法分析器
 * Lexical analyzer for DataNodes
 */
export interface InlineDataNodeTokenizer<T extends DataNodeType>
  extends DataNodeTokenizer<T> {
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
