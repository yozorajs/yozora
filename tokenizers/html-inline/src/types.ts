import type { Html, HtmlType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
  PartialYastInlineToken,
} from '@yozora/core-tokenizer'
import type {
  HtmlInlineCDataDelimiter,
  HtmlInlineCDataTokenData,
} from './util/cdata'
import type {
  HtmlInlineClosingDelimiter,
  HtmlInlineClosingTokenData,
} from './util/closing'
import type {
  HtmlInlineCommentDelimiter,
  HtmlInlineCommentTokenData,
} from './util/comment'
import type {
  HtmlInlineDeclarationDelimiter,
  HtmlInlineDeclarationTokenData,
} from './util/declaration'
import type {
  HtmlInlineInstructionDelimiter,
  HtmlInlineInstructionTokenData,
} from './util/instruction'
import type {
  HtmlInlineOpenDelimiter,
  HtmlInlineOpenTokenData as HtmlInlineOpenTokenData,
} from './util/open'

export type T = HtmlType
export type Node = Html
export const uniqueName = '@yozora/tokenizer-html-inline'

/**
 * Text between '<' and '>' that looks like an HTML tag is parsed as a raw
 * HTML tag and will be rendered in HTML without escaping. Tag and attribute
 * names are not limited to current HTML tags, so custom tags (and even, say,
 * DocBook tags) may be used.
 *
 * @see https://github.github.com/gfm/#raw-html
 */
export type Token = PartialYastInlineToken<T> &
  (
    | HtmlInlineOpenTokenData
    | HtmlInlineClosingTokenData
    | HtmlInlineCommentTokenData
    | HtmlInlineInstructionTokenData
    | HtmlInlineDeclarationTokenData
    | HtmlInlineCDataTokenData
  )

export type Delimiter =
  | HtmlInlineOpenDelimiter
  | HtmlInlineClosingDelimiter
  | HtmlInlineCommentDelimiter
  | HtmlInlineInstructionDelimiter
  | HtmlInlineDeclarationDelimiter
  | HtmlInlineCDataDelimiter

export interface TokenizerProps extends Partial<BaseTokenizerProps> {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
}
