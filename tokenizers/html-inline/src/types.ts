import type { Html, HtmlType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialInlineToken,
  ITokenizer,
} from '@yozora/core-tokenizer'
import type { IHtmlInlineCDataDelimiter, IHtmlInlineCDataTokenData } from './util/cdata'
import type { IHtmlInlineClosingDelimiter, IHtmlInlineClosingTokenData } from './util/closing'
import type { IHtmlInlineCommentDelimiter, IHtmlInlineCommentTokenData } from './util/comment'
import type {
  IHtmlInlineDeclarationDelimiter,
  IHtmlInlineDeclarationTokenData,
} from './util/declaration'
import type {
  IHtmlInlineInstructionDelimiter,
  IHtmlInlineInstructionTokenData,
} from './util/instruction'
import type { IHtmlInlineOpenDelimiter, IHtmlInlineOpenTokenData } from './util/open'

export type T = HtmlType
export type INode = Html
export const uniqueName = '@yozora/tokenizer-html-inline'

/**
 * Text between '<' and '>' that looks like an HTML tag is parsed as a raw
 * HTML tag and will be rendered in HTML without escaping. Tag and attribute
 * names are not limited to current HTML tags, so custom tags (and even, say,
 * DocBook tags) may be used.
 *
 * @see https://github.github.com/gfm/#raw-html
 */
export type IToken = IPartialInlineToken<T> &
  (
    | IHtmlInlineOpenTokenData
    | IHtmlInlineClosingTokenData
    | IHtmlInlineCommentTokenData
    | IHtmlInlineInstructionTokenData
    | IHtmlInlineDeclarationTokenData
    | IHtmlInlineCDataTokenData
  )

export type IDelimiter =
  | IHtmlInlineOpenDelimiter
  | IHtmlInlineClosingDelimiter
  | IHtmlInlineCommentDelimiter
  | IHtmlInlineInstructionDelimiter
  | IHtmlInlineDeclarationDelimiter
  | IHtmlInlineCDataDelimiter

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
