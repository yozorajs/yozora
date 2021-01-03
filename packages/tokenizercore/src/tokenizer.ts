import type { YastNodeType } from './types/node'


/**
 * Params for constructing BlockTokenizer
 */
export interface TokenizerProps<T extends YastNodeType = YastNodeType> {
  /**
   * The priority of the tokenizer.
   * The larger the value, the higher the priority.
   */
  readonly priority: number
  /**
   * Name of a tokenizer
   */
  readonly name?: string
  /**
   * The node types that the current tokenizer can recognize, is used to
   * quickly locate the tokenizer which can handle this type of data.
   */
  readonly uniqueTypes?: T[]
}


/**
 * Base Tokenizer
 */
export class Tokenizer<T extends YastNodeType> {
  public readonly name: string = ''
  public readonly uniqueTypes: T[] = []
  public readonly priority: number

  public constructor(props: TokenizerProps<T>) {
    const { priority, name, uniqueTypes, } = props
    this.priority = priority

    const self = this as { -readonly [P in keyof this]: this[P] }

    // cover name and uniqueTypes if they specified
    if (name != null) {
      self.name = name
    }

    // cover uniqueTypes if they specified
    if (uniqueTypes != null && uniqueTypes.length > 0) {
      self.uniqueTypes = uniqueTypes
    }
  }
}
