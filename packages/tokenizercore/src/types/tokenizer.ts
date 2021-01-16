import type { YastNodeType } from './node'


/**
 * Params for constructing BlockTokenizer
 */
export interface TokenizerProps {

}


/**
 * YastNode Tokenizer
 */
export interface Tokenizer<T extends YastNodeType> {
  /**
   * Name of a tokenizer (in order to identify a unique YastNode Tokenizer)
   */
  readonly name: string
  /**
   * YastNode types that can be recognized by a tokenizer
   */
  readonly uniqueTypes: T[]
}
