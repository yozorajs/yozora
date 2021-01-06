import type { ImmutableBlockTokenizerContext } from './types/context'
import type { YastBlockNodeType } from './types/node'
import type { BlockTokenizer } from './types/tokenizer'
import { Tokenizer } from '@yozora/tokenizercore'


/**
 * Abstract BlockTokenizer
 */
export abstract class BaseBlockTokenizer<T extends YastBlockNodeType> extends Tokenizer<T>
  implements BlockTokenizer<T> {
  public abstract readonly name: string

  /**
   * Get context of the block tokenizer
   */
  getContext(): ImmutableBlockTokenizerContext | null {
    return null
  }
}
