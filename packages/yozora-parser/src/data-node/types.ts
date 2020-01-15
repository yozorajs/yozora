import { BlockDataNodeType, InlineDataNodeType } from '@yozora/core'


/**
 * 数据节点内容的位置
 * Location of content of DataNode
 */
export interface DataNodeTokenPoint {
  /**
   * 偏移量（从 0 开始计数）
   * @minimum 0
   */
  offset: number
  /**
   * 行号
   * @minimum 1
   */
  line: number
  /**
   * 列号
   * @minimum 1
   */
  column: number
}


/**
 * 数据节点在源内容中的位置范围信息
 * Location range information of DataNode in source content
 */
export interface DataNodeTokenPosition {
  /**
   * 起始位置（闭区间）
   * Starting position (closed)
   */
  start: DataNodeTokenPoint
  /**
   * 结束位置（开区间）
   * End position (open)
   */
  end: DataNodeTokenPoint
}


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
   * @param content
   * @returns Matching location information
   */
  match(content: string): DataNodeTokenPosition[]
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
