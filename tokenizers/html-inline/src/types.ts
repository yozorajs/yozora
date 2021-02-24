import type { YastLiteral, YastNode, YastToken } from '@yozora/tokenizercore'
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

/**
 * typeof HtmlInline
 */
export const HtmlInlineType = 'htmlInline'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type HtmlInlineType = typeof HtmlInlineType

/**
 * Text between '<' and '>' that looks like an HTML tag is parsed as a raw
 * HTML tag and will be rendered in HTML without escaping. Tag and attribute
 * names are not limited to current HTML tags, so custom tags (and even, say,
 * DocBook tags) may be used.
 *
 * @see https://github.github.com/gfm/#raw-html
 */
export interface HtmlInline extends YastNode<HtmlInlineType>, YastLiteral {
  /**
   * Inner HTML tag type
   * @see https://github.github.com/gfm/#html-tag
   */
  htmlType:
    | 'cdata'
    | 'closing'
    | 'comment'
    | 'declaration'
    | 'instruction'
    | 'open'
}

/**
 * A htmlInline token.
 */
export type HtmlInlineToken = YastToken<HtmlInlineType> & HtmlInlineTokenData

/**
 * Data of HtmlInlineToken.
 */
export type HtmlInlineTokenData =
  | HtmlInlineOpenTokenData
  | HtmlInlineClosingTokenData
  | HtmlInlineCommentTokenData
  | HtmlInlineInstructionTokenData
  | HtmlInlineDeclarationTokenData
  | HtmlInlineCDataTokenData

/**
 * Delimiter of HtmlInlineToken
 */
export type HtmlInlineTokenDelimiter =
  | HtmlInlineOpenDelimiter
  | HtmlInlineClosingDelimiter
  | HtmlInlineCommentDelimiter
  | HtmlInlineInstructionDelimiter
  | HtmlInlineDeclarationDelimiter
  | HtmlInlineCDataDelimiter
