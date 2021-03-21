import type { Html } from '@yozora/ast'
import type { YastToken } from '@yozora/core-tokenizer'
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

export const uniqueName = '@yozora/tokenizer-html-inline'
export type T = typeof uniqueName
export type Node = Html

/**
 * Text between '<' and '>' that looks like an HTML tag is parsed as a raw
 * HTML tag and will be rendered in HTML without escaping. Tag and attribute
 * names are not limited to current HTML tags, so custom tags (and even, say,
 * DocBook tags) may be used.
 *
 * @see https://github.github.com/gfm/#raw-html
 */
export type Token = YastToken<T> &
  (
    | HtmlInlineOpenTokenData
    | HtmlInlineClosingTokenData
    | HtmlInlineCommentTokenData
    | HtmlInlineInstructionTokenData
    | HtmlInlineDeclarationTokenData
    | HtmlInlineCDataTokenData
  )

/**
 * Delimiter of HtmlInlineToken
 */
export type Delimiter =
  | HtmlInlineOpenDelimiter
  | HtmlInlineClosingDelimiter
  | HtmlInlineCommentDelimiter
  | HtmlInlineInstructionDelimiter
  | HtmlInlineDeclarationDelimiter
  | HtmlInlineCDataDelimiter

/**
 * Params for constructing HtmlTokenizer
 */
export interface TokenizerProps {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
  /**
   * Delimiter priority.
   */
  readonly delimiterPriority?: number
}
