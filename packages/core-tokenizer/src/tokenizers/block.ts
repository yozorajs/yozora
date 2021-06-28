import type { Tokenizer } from '../types/tokenizer'

/**
 * Params for constructing a BaseBlockTokenizer.
 */
export interface BaseBlockTokenizerProps {
  /**
   * Tokenizer name.
   */
  name: string
  /**
   * Priority of the tokenizer.
   */
  priority: number
}

/**
 * Base block tokenizer.
 */
export abstract class BaseBlockTokenizer implements Tokenizer {
  public readonly name: string
  public readonly priority: number
  public abstract readonly isContainingBlock: boolean

  constructor(props: BaseBlockTokenizerProps) {
    this.name = props.name
    this.priority = props.priority
  }

  /**
   * Returns a string representing the tokenizer.
   * @override
   */
  public toString(): string {
    return this.name
  }
}
