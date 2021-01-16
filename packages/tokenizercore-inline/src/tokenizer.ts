import type { YastInlineNodeType } from './types/node'
import type { InlineTokenizer, InlineTokenizerProps } from './types/tokenizer'


/**
 * Abstract InlineTokenizer
 */
export abstract class BaseInlineTokenizer<T extends YastInlineNodeType>
  implements InlineTokenizer<T> {
  public abstract readonly name: string
  public abstract readonly uniqueTypes: T[]
  public readonly priority: number

  public constructor(props: InlineTokenizerProps) {
    const { priority } = props
    this.priority = priority
  }
}
