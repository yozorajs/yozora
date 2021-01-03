import type { YastInlineNodeType } from './types/base'
import type { InlineTokenizer, InlineTokenizerProps } from './types/tokenizer'


/**
 * Abstract InlineTokenizer
 */
export abstract class BaseInlineTokenizer<T extends YastInlineNodeType>
  implements InlineTokenizer<T>
{
  public abstract readonly name: string
  public abstract readonly uniqueTypes: T[]
  public readonly priority: number

  public constructor(params: InlineTokenizerProps) {
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
