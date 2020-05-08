import {
  BlockDataNodeType,
  BlockTokenizer,
  BlockTokenizerConstructorParams,
  InlineDataNodeParseFunc,
} from './types'


/**
 * 块状数据的词法分析器的抽象类
 */
export abstract class BaseBlockTokenizer<
  T extends BlockDataNodeType,
  M extends any = any,
  > implements BlockTokenizer<T, M>  {
  public abstract readonly name: string
  public abstract readonly uniqueTypes: T[]
  public readonly parseInlineData?: InlineDataNodeParseFunc<M>
  public readonly priority: number

  public constructor(params: BlockTokenizerConstructorParams) {
    const { name, priority, uniqueTypes } = params
    this.priority = priority

    // cover name and uniqueTypes if they specified
    const self = this as this & any
    if (name != null) self.name = name
    if (uniqueTypes != null && uniqueTypes.length > 0) {
      self.uniqueTypes = uniqueTypes
    }
  }
}
