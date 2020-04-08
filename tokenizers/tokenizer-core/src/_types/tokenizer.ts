import { DataNodeType } from './data-node'


/**
 * 数据节点的词法分析器
 * Lexical analyzer for DataNodes
 */
export interface DataNodeTokenizer<T extends DataNodeType = DataNodeType> {
  /**
   * The name of the tokenizer
   */
  readonly name: string

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
}


/**
 * 数据节点的分词器的构造函数的参数
 * Params for DataNodeTokenizerConstructor
 */
export interface DataNodeTokenizerConstructorParams<T extends DataNodeType = DataNodeType> {
  /**
   * 词法分析器的优先级，数值越大，优先级越高
   * The priority of the tokenizer.
   * The larger the value, the higher the priority.
   */
  readonly priority: number
  /**
   * The name of the tokenizer
   */
  readonly name?: string
  /**
   * 当前分词器可识别的数据节点类型
   * 用于在解析操作中，快速定位到 match 函数返回的数据中数据节点所对应的分词器
   */
  readonly recognizedTypes?: T[]
}


/**
 * 词法解析器的构造类接口
 * Constructor of DataNodeTokenizer
 */
export interface DataNodeTokenizerConstructor<
  T extends DataNodeType = DataNodeType,
  DT extends DataNodeTokenizer<T> = DataNodeTokenizer<T>,
  > {
  new(params: DataNodeTokenizerConstructorParams<T>): DT
}

