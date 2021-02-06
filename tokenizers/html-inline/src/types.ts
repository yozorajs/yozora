import type { YastLiteral } from '@yozora/tokenizercore'
import type {
  InlineTokenizerMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'
import type {
  HtmlInlineCDataDelimiter,
  HtmlInlineCDataMatchPhaseStateData,
} from './util/cdata'
import type {
  HtmlInlineClosingDelimiter,
  HtmlInlineClosingMatchPhaseStateData,
} from './util/closing'
import type {
  HtmlInlineCommentDelimiter,
  HtmlInlineCommentMatchPhaseStateData,
} from './util/comment'
import type {
  HtmlInlineDeclarationDelimiter,
  HtmlInlineDeclarationMatchPhaseStateData,
} from './util/declaration'
import type {
  HtmlInlineInstructionDelimiter,
  HtmlInlineInstructionMatchPhaseStateData,
} from './util/instruction'
import type {
  HtmlInlineOpenDelimiter,
  HtmlInlineOpenMatchPhaseStateData,
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
export interface HtmlInline extends YastInlineNode<HtmlInlineType>, YastLiteral {
  /**
   * Inner HTML tag type
   * @see https://github.github.com/gfm/#html-tag
   */
  htmlType: 'cdata' | 'closing' | 'comment' | 'declaration' | 'instruction' | 'open'
}


/**
 * State on match phase of HtmlInlineTokenizer
 */
export type HtmlInlineMatchPhaseState =
  & InlineTokenizerMatchPhaseState<HtmlInlineType>
  & HtmlInlineMatchPhaseStateData


/**
 * State data of match phase of HtmlInlineTokenizer
 */
export type HtmlInlineMatchPhaseStateData =
  | HtmlInlineOpenMatchPhaseStateData
  | HtmlInlineClosingMatchPhaseStateData
  | HtmlInlineCommentMatchPhaseStateData
  | HtmlInlineInstructionMatchPhaseStateData
  | HtmlInlineDeclarationMatchPhaseStateData
  | HtmlInlineCDataMatchPhaseStateData


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
