import { InlineDataNodeType } from './base'


/**
 * 内联数据节点的分词器的构造函数的参数
 * Params for InlineTokenizerConstructor
 */
export interface InlineTokenizerConstructorParams<
  T extends InlineDataNodeType = InlineDataNodeType,
  > {
  /**
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
  readonly uniqueTypes?: T[]
}


/**
 * 内联数据节点的分词器
 *
 * Tokenizer for Inline data node
 */
export interface InlineTokenizer<
  T extends InlineDataNodeType = InlineDataNodeType,
  > {
  /**
   * The name of the tokenizer
   */
  readonly name: string
  /**
   * The priority of the tokenizer.
   * The larger the value, the higher the priority.
   */
  readonly priority: number
  /**
   * 当前分词器可识别的数据节点类型
   * 用于在解析操作中，快速定位到 match 函数返回的数据中数据节点所对应的分词器
   */
  readonly uniqueTypes: T[]
}
