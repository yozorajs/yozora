import { HtmlBlockTokenizer } from './tokenizer'

export * from './util/eat-html-attribute'
export * from './util/eat-html-tagname'

export { HtmlBlockTokenizer } from './tokenizer'
export { uniqueName as HtmlBlockTokenizerName } from './types'
export type {
  Token as HtmlBlockToken,
  TokenizerProps as HtmlBlockTokenizerProps,
} from './types'
export default HtmlBlockTokenizer
