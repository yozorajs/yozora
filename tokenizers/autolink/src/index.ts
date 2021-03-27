import { AutolinkTokenizer } from './tokenizer'

export * from './util/email'
export * from './util/uri'

export { AutolinkTokenizer } from './tokenizer'
export { uniqueName as AutolinkTokenizerName } from './types'
export type {
  Token as AutolinkToken,
  TokenizerProps as AutolinkTokenizerProps,
  AutolinkContentType,
} from './types'
export default AutolinkTokenizer
