import type { YastInlineNodeType } from './types/base'
import type { InlineTokenizer } from './types/tokenizer'
import { Tokenizer } from '@yozora/tokenizercore'


/**
 * Abstract InlineTokenizer
 */
export abstract class BaseInlineTokenizer<T extends YastInlineNodeType>
  extends Tokenizer<T>
  implements InlineTokenizer<T> {
  public abstract readonly name: string
  public abstract readonly uniqueTypes: T[]
}
