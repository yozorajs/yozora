import {
  BlockDataNodeType,
  InlineDataNodeType,
  DataNodeTokenFlankingGraph,
  InlineDataNode,
  BlockDataNode,
  DataNodeTokenFlankingAssemblyGraph,
  DataNodeTokenFlankingAssemblyGraphEdge,
  DataNodeTokenPoint,
  DataNode,
} from '@yozora/core'


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
   * @param codePoints  unicode code points of content (`String.codePointAt()`)
   * @returns Matching location information
   */
  match(content: string, codePoints: number[]): DataNodeTokenFlankingGraph<T>
  /**
   * 检查候选匹配项是否合法
   * @param content
   * @param codePoints
   * @param points        点集
   * @param matches
   * @param innerMatches
   */
  checkCandidatePartialMatches(
    content: string,
    codePoints: number[],
    points: DataNodeTokenPoint[],
    matches: DataNodeTokenFlankingAssemblyGraphEdge<T>,
    innerMatches?: DataNodeTokenFlankingAssemblyGraphEdge<T>[],
  ): boolean
  /**
   * 解析指定区间的内容
   * @param content
   * @param codePoints
   * @param points
   * @param matches
   * @param innerMatches
   */
  parse(
    content: string,
    codePoints: number[],
    points: DataNodeTokenPoint[],
    matches: DataNodeTokenFlankingAssemblyGraphEdge<T>,
    innerMatches?: DataNodeTokenFlankingAssemblyGraphEdge<T>[],
  ): DataNode[]
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
 * DataNodeTokenizer context
 */
export interface DataNodeTokenizerContext {
  /**
   * 向词法分析器上下文中注册解析块数据的词法分析器
   * Register a BlockDataTokenizer in the DataNodeTokenizer context
   * @param tokenizer             块类型的数据节点的词法解析器
   * @param TokenizerConstructor  词法解析器的构造函数
   */
  useBlockDataTokenizer(tokenizer: BlockDataNodeTokenizer): this
  useBlockDataTokenizer(
    priority: number,
    TokenizerConstructor: BlockDataNodeTokenizerConstructor
  ): this

  /**
   * 向词法分析器上下文中注册解析内联数据的词法分析器
   * Register a InlineDataTokenizer in the DataNodeTokenizer context
   * @param tokenizer             内联类型的数据节点的词法解析器
   * @param TokenizerConstructor  词法解析器的构造函数
   */
  useInlineDataTokenizer(tokenizer: InlineDataNodeTokenizer): this
  useInlineDataTokenizer(priority: number,
    TokenizerConstructor: InlineDataNodeTokenizerConstructor
  ): this

  /**
   * parsing block data
   * @param content
   * @param codePoints
   */
  parseBlockData(content: string, codePoints: number[]): BlockDataNode[]

  /**
   * parsing inline data
   * @param content
   * @param codePoints
   */
  parseInlineData(content: string, codePoints: number[]): InlineDataNode[]
}


export interface Mediator {
  /**
   * 检查边界区间的优先级；
   * e1 < e2
   *
   * @param g
   * @param e1
   * @param e2
   */
  checkPriority<T extends InlineDataNodeType | BlockDataNodeType>(
    g: DataNodeTokenFlankingAssemblyGraph<T>,
    e1: DataNodeTokenFlankingAssemblyGraphEdge<T>,
    e2: DataNodeTokenFlankingAssemblyGraphEdge<T>,
  ): -1 | 0 | 1
}
