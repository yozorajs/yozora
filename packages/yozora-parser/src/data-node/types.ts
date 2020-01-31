import { BlockDataNodeType, InlineDataNodeType, DataNodeTokenFlankingGraph } from '@yozora/core'


/**
 * 数据节点的词法分析器
 * Lexical analyzer for DataNodes
 */
export interface DataNodeTokenizer<T extends BlockDataNodeType | InlineDataNodeType> {
  /**
   * 词法分析器类型
   * Lexical Analyzer Type
   */
  readonly type: T
  /**
   * 词法分析器的优先级，数值越大，优先级越高
   * The priority of the tokenizer.
   * The larger the value, the higher the priority.
   */
  readonly priority: number
  /**
   * 匹配内容，获得所有的匹配此词法分析器的内容区间位置信息
   * Match content to get all the location information of the content that matches this tokenizer
   *
   * @param codePoints  unicode code points of content (`String.codePointAt()`)
   * @returns Matching location information
   */
  match(codePoints: number[]): DataNodeTokenFlankingGraph<T>
}


/**
 * 词法解析器的构造类接口
 * Constructor of DataNodeTokenizer
 */
export interface DataNodeTokenizerConstructor<
  T extends BlockDataNodeType | InlineDataNodeType,
  D extends DataNodeTokenizer<T>
> {
  new (context: DataNodeTokenizerContext, priority: number): D
}


/**
 * 块数据的词法分析器
 * Lexical Analyzer for BlockDataNode
 */
export interface BlockDataNodeTokenizer<T extends BlockDataNodeType = BlockDataNodeType>
  extends DataNodeTokenizer<T> {

}


/**
 * 内联数据的词法分析器
 * Lexical Analyzer for InlineDataNode
 */
export interface InlineDataNodeTokenizer<T extends InlineDataNodeType = InlineDataNodeType>
  extends DataNodeTokenizer<T> {

}


/**
 * 块数据词法解析器的构造类
 * Constructor class for BlockDataNodeTokenizer
 */
export type BlockDataNodeTokenizerConstructor<T extends BlockDataNodeType = BlockDataNodeType>
  = DataNodeTokenizerConstructor<T, BlockDataNodeTokenizer<T>>


/**
 * 内联数据词法解析器的构造类
 * Constructor class for InlineDataNodeTokenizer
 */
export type InlineDataNodeTokenizerConstructor<T extends InlineDataNodeType = InlineDataNodeType>
  = DataNodeTokenizerConstructor<T, InlineDataNodeTokenizer<T>>


/**
 * 数据节点的词法分析器的上下文
 */
export interface DataNodeTokenizerContext {
  /**
   * 向词法分析器上下文中注册解析块数据的词法分析器
   * @param tokenizer 块类型的数据节点的词法解析器
   */
  useBlockDataTokenizer(tokenizer: BlockDataNodeTokenizer): this
  useBlockDataTokenizer(priority: number, TokenizerConstructor: BlockDataNodeTokenizerConstructor): this
  /**
   * 向词法分析器上下文中注册解析内联数据的词法分析器
   * @param tokenizer 内联类型的数据节点的词法解析器
   */
  useInlineDataTokenizer(tokenizer: InlineDataNodeTokenizer): this
  useInlineDataTokenizer(priority: number, TokenizerConstructor: InlineDataNodeTokenizerConstructor): this
}
