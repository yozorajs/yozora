import type { Mutable } from '@yozora/tokenizercore'
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
  public abstract readonly uniqueTypes: T[]
  public readonly priority: number
  public readonly interruptableTypes: YastBlockNodeType[] = []

  public constructor(props: BlockTokenizerProps) {
    const { priority, interruptableTypes } = props
    this.priority = priority

    const self = this as Mutable<this>

    // cover interruptableTypes
    if (interruptableTypes != null) {
      self.interruptableTypes = interruptableTypes
    }
  }

  /**
   * @override
   * @see BlockTokenizer
   */
  public getContext(): ImmutableBlockTokenizerContext | null {
    return null
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public couldInterruptPreviousSibling(type: YastBlockNodeType): boolean {
    return this.interruptableTypes.includes(type)
  }
}
