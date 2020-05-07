import { BlockDataNodeTokenizer, BlockDataNodeType } from './types'


/**
 * 块状数据节点的分词器的构造函数的参数
 * Params for BlockDataNodeTokenizerConstructor
 */
export interface BlockDataNodeTokenizerConstructorParams<
  T extends BlockDataNodeType = BlockDataNodeType
  > {
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
  readonly uniqueTypes?: T[]
}


/**
 * 块状数据的词法分析器的抽象类
 */
export abstract class BaseBlockDataNodeTokenizer<
  T extends BlockDataNodeType,
  > implements BlockDataNodeTokenizer<T>  {
  public abstract readonly name: string
  public abstract readonly uniqueTypes: T[]
  public readonly priority: number

  public constructor(params: BlockDataNodeTokenizerConstructorParams) {
    const { name, priority, uniqueTypes } = params
    this.priority = priority

    // cover name and recognizedTypes if they specified
    const self = this as this & any
    if (name != null) self.name = name
    if (uniqueTypes != null && uniqueTypes.length > 0) {
      self.recognizedTypes = uniqueTypes
    }
  }
}
