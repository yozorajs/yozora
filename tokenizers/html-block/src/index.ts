export * from './util/eat-html-attribute'
export * from './util/eat-html-tagname'
export { HtmlBlockTokenizer, HtmlBlockTokenizer as default } from './tokenizer'
export { uniqueName as HtmlBlockTokenizerName } from './types'
export type {
  IToken as IHtmlBlockToken,
  ITokenizerProps as IHtmlBlockTokenizerProps,
} from './types'
