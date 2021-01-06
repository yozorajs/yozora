import type { ImmutableBlockTokenizerContext } from './types/context'
import type {
  BlockTokenizerMatchPhaseStateData,
} from './types/lifecycle/match'
import type { YastBlockNodeType } from './types/node'
import type { BlockTokenizer } from './types/tokenizer'
import { Tokenizer } from '@yozora/tokenizercore'


/**
 * Abstract BlockTokenizer
 */
export abstract class BaseBlockTokenizer<
  T extends YastBlockNodeType,
  MSD extends BlockTokenizerMatchPhaseStateData<T> = BlockTokenizerMatchPhaseStateData<T>>
  extends Tokenizer<T>
  implements BlockTokenizer<T, MSD> {
  public abstract readonly name: string

  /**
   * Get context of the block tokenizer
   */
  getContext(): ImmutableBlockTokenizerContext | null {
    return null
  }
}
