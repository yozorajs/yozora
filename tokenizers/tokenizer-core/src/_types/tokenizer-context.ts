import { DataNode, DataNodeType } from './data-node'
import { DataNodeTokenPointDetail, DataNodeTokenPosition } from './token'
import { DataNodeTokenizer } from './tokenizer'


/**
 * 数据节点的词法分析器的上下文
 * DataNodeTokenizer context
 */
export interface DataNodeTokenizerContext<
  T extends DataNodeType = DataNodeType,
  DT extends DataNodeTokenizer<T> = DataNodeTokenizer<T>,
  DTP extends DataNodeTokenPosition<T> = DataNodeTokenPosition<T>,
  > {
  /**
   * 向词法分析器上下文中注册词法分析器
   * Register a DataNodeTokenizer in the context
   * @param tokenizer
   */
  useTokenizer(tokenizer: DT): this

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
  ): DTP[]

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
    tokenPositions: DTP[],
    startOffset: number,
    endOffset: number,
  ): DataNode[]
}
