import {
  BlockDataNodeType,
  BlockTokenizer,
  BlockTokenizerConstructorParams,
} from './types'


/**
 * 块状数据的词法分析器的抽象类
 */
export abstract class BaseBlockTokenizer<T extends BlockDataNodeType>
  implements BlockTokenizer<T>  {
  public abstract readonly name: string
  public abstract readonly uniqueTypes: T[]
  public readonly priority: number

  public constructor(params: BlockTokenizerConstructorParams<T>) {
    const { name, priority, uniqueTypes } = params
    this.priority = priority

    // cover name and uniqueTypes if they specified
    const self = this as { -readonly [P in keyof this]: this[P] }
    if (name != null) self.name = name
    if (uniqueTypes != null && uniqueTypes.length > 0) {
      self.uniqueTypes = uniqueTypes
    }
  }
}
