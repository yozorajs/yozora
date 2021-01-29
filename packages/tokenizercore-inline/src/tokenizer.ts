import type { ImmutableInlineTokenizerContext } from './types/context'
import type { InlineTokenizer } from './types/tokenizer/tokenizer'


/**
 * Abstract InlineTokenizer
 */
export abstract class BaseInlineTokenizer implements InlineTokenizer {
  public abstract readonly name: string

  /**
   * @override
   * @see InlineTokenizer
   */
  public getContext(): ImmutableInlineTokenizerContext | null {
    return null
  }
}
