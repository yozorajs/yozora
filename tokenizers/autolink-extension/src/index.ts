import { AutolinkExtensionTokenizer } from './tokenizer'

export * from './util/email'
export * from './util/uri'

export { AutolinkExtensionTokenizer } from './tokenizer'
export { uniqueName as AutolinkExtensionTokenizerName } from './types'
export type {
  Token as AutolinkExtensionToken,
  TokenizerProps as AutolinkExtensionTokenizerProps,
} from './types'
export default AutolinkExtensionTokenizer
