import { HtmlInlineTokenizer } from './tokenizer'

export * from './util/cdata'
export * from './util/closing'
export * from './util/comment'
export * from './util/declaration'
export * from './util/instruction'
export * from './util/open'

export { HtmlInlineTokenizer } from './tokenizer'
export { uniqueName as HtmlInlineTokenizerName } from './types'
export type {
  Token as HtmlInlineToken,
  TokenizerProps as HtmlInlineTokenizerProps,
} from './types'
export default HtmlInlineTokenizer
