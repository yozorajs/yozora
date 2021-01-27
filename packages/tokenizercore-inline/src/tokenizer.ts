import type { ImmutableInlineTokenizerContext } from './types/context'
import type {
  InlineTokenizer,
  InlineTokenizerProps,
} from './types/tokenizer/tokenizer'


/**
 * Abstract InlineTokenizer
 */
export abstract class BaseInlineTokenizer implements InlineTokenizer {
  public abstract readonly name: string
  public readonly priority: number

  public constructor(props: InlineTokenizerProps) {
    const { priority } = props
    this.priority = priority
  }

  /**
   * @override
   * @see InlineTokenizer
   */
  public getContext(): ImmutableInlineTokenizerContext | null {
    return null
  }
}
