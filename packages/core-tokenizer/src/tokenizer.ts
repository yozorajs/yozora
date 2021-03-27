import type { TokenizerContext } from './types/context'
import type { Tokenizer } from './types/tokenizer'

/**
 * Params for constructing a BaseTokenizer.
 */
export interface BaseTokenizerProps {
  /**
   * Tokenizer name.
   */
  name: string
  /**
   * Priority of the tokenizer.
   * @default 0
   */
  priority?: number
}

/**
 * Base tokenizer.
 */
export class BaseTokenizer implements Tokenizer {
  public readonly name: string
  public readonly priority: number

  constructor(props: BaseTokenizerProps) {
    this.name = props.name
    this.priority = props.priority ?? 0
  }

  /**
   * Get context of the composed tokenizers.
   * @override
   */
  public getContext(): TokenizerContext | null {
    return null
  }

  /**
   * Returns a string representing the tokenizer.
   * @override
   */
  public toString(): string {
    return this.name
  }
}
