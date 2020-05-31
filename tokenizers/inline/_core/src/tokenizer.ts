import {
  InlineDataNodeType,
  InlineTokenizer,
  InlineTokenizerConstructorParams,
} from './types'


/**
 * 内联数据的词法分析器的抽象类
 */
export abstract class BaseInlineTokenizer<T extends InlineDataNodeType>
  implements InlineTokenizer<T>
{
  public abstract readonly name: string
  public abstract readonly uniqueTypes: T[]
  public readonly priority: number

  public constructor(params: InlineTokenizerConstructorParams) {
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
