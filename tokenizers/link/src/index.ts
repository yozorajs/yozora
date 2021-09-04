import { LinkTokenizer } from './tokenizer'

export * from './util/check-brackets'
export * from './util/link-destination'
export * from './util/link-title'

export { LinkTokenizer } from './tokenizer'
export { uniqueName as LinkTokenizerName } from './types'
export type {
  Token as LinkToken,
  TokenizerProps as LinkTokenizerProps,
} from './types'
export default LinkTokenizer
