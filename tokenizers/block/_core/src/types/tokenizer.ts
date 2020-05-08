import { BlockDataNodeType, InlineDataNodeParseFunc } from './base'


/**
 * 块状数据节点的分词器的构造函数的参数
 * Params for BlockTokenizerConstructor
 */
export interface BlockTokenizerConstructorParams<
  T extends BlockDataNodeType = BlockDataNodeType,
  M extends any = any,
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
  /**
   *
   */
  readonly parseInlineData?: InlineDataNodeParseFunc<M>,
}


/**
 * 块状数据节点的分词器
 *
 * Tokenizer for block data node
 */
export interface BlockTokenizer<
  T extends BlockDataNodeType = BlockDataNodeType,
  M extends any = any,
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
  /**
   *
   */
  readonly parseInlineData?: InlineDataNodeParseFunc<M>,
}
