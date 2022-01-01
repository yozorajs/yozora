import type { ITokenizer } from '../types/tokenizer'

/**
 * Params for constructing a BaseBlockTokenizer.
 */
export interface IBaseBlockTokenizerProps {
  /**
   * ITokenizer name.
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
export abstract class BaseBlockTokenizer implements ITokenizer {
  public readonly name: string
  public readonly priority: number
  public abstract readonly isContainingBlock: boolean

  constructor(props: IBaseBlockTokenizerProps) {
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
