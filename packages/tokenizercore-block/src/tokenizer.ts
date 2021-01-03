import type { BlockTokenizer, YastBlockNodeType } from './types'
import { Tokenizer } from '@yozora/tokenizercore'


/**
 * Abstract BlockTokenizer
 */
export abstract class BaseBlockTokenizer<T extends YastBlockNodeType>
  extends Tokenizer<T>
  implements BlockTokenizer<T> {
  public abstract readonly name: string
  public abstract readonly uniqueTypes: T[]
}
