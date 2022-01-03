export * from './util/eat-html-attribute'
export * from './util/eat-html-tagname'
export { match as htmlBlockMatch } from './match'
export { parse as htmlBlockParse } from './parse'
export { HtmlBlockTokenizer, HtmlBlockTokenizer as default } from './tokenizer'
export { uniqueName as HtmlBlockTokenizerName } from './types'
export type {
  IHookContext as IHtmlBlockHookContext,
  IToken as IHtmlBlockToken,
  ITokenizerProps as IHtmlBlockTokenizerProps,
} from './types'
