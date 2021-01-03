import type {
  BlockTokenizer,
  BlockTokenizerProps,
  YastBlockNodeType,
} from './types'


/**
 * Abstract BlockTokenizer
 */
export abstract class BaseBlockTokenizer<T extends YastBlockNodeType>
  implements BlockTokenizer<T> {
  public abstract readonly name: string
  public abstract readonly uniqueTypes: T[]
  public readonly priority: number

  public constructor(props: BlockTokenizerProps<T>) {
    const { name, priority, uniqueTypes } = props
    this.priority = priority

    // cover name and uniqueTypes if they specified
    const self = this as { -readonly [P in keyof this]: this[P] }
    if (name != null) self.name = name
    if (uniqueTypes != null && uniqueTypes.length > 0) {
      self.uniqueTypes = uniqueTypes
    }
  }
}
