import type { ImmutableBlockTokenizerContext } from './types/context'
import type { YastBlockNodeType } from './types/node'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseState,
  BlockTokenizerProps,
} from './types/tokenizer'


/**
 * Abstract BlockTokenizer
 */
export abstract class BaseBlockTokenizer<
  T extends YastBlockNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  PMS extends BlockTokenizerPostMatchPhaseState<T> = BlockTokenizerPostMatchPhaseState<T>,
>
  implements BlockTokenizer<T, MS, PMS> {
  public abstract readonly name: string

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(props: BlockTokenizerProps) {

  }

  /**
   * @override
   * @see BlockTokenizer
   */
  public getContext(): ImmutableBlockTokenizerContext | null {
    return null
  }
}
