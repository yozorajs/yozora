import type {
  InlineTokenizerMatchPhaseState,
  InlineTokenizerPostMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'
import type {
  HtmlInlineCDataDelimiter,
  HtmlInlineCDataMatchPhaseStateData,
  HtmlInlineCDataTagType,
} from './util/cdata'
import type {
  HtmlInlineClosingDelimiter,
  HtmlInlineClosingMatchPhaseStateData,
  HtmlInlineClosingTagType,
} from './util/closing'
import type {
  HtmlInlineCommentDelimiter,
  HtmlInlineCommentMatchPhaseData,
  HtmlInlineCommentTagType,
} from './util/comment'
import type {
  HtmlInlineDeclarationDelimiter,
  HtmlInlineDeclarationMatchPhaseData,
  HtmlInlineDeclarationTagType,
} from './util/declaration'
import type {
  HtmlInlineInstructionDelimiter,
  HtmlInlineInstructionMatchPhaseStateData,
  HtmlInlineInstructionTagType,
} from './util/instruction'
import type {
  HtmlInlineOpenDelimiter,
  HtmlInlineOpenMatchPhaseData,
  HtmlInlineOpenTagType,
} from './util/open'


/**
 * typeof HtmlInline
 */
export const HtmlInlineType = 'htmlInline'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type HtmlInlineType = typeof HtmlInlineType


export type HtmlInlineTagType =
  | HtmlInlineOpenTagType
  | HtmlInlineClosingTagType
  | HtmlInlineCommentTagType
  | HtmlInlineInstructionTagType
  | HtmlInlineDeclarationTagType
  | HtmlInlineCDataTagType


/**
 *
 * @example
 *    ````markdown
 *    ````
 *    ===>
 *    ```js
 *    ```
 */
export interface HtmlInline extends YastInlineNode<HtmlInlineType> {
  /**
   * Inner HTML tag type
   * @see https://github.github.com/gfm/#html-tag
   */
  tagType: HtmlInlineTagType
}


/**
 * State on match phase of HtmlInlineTokenizer
 */
export type HtmlInlineMatchPhaseState =
  & InlineTokenizerMatchPhaseState<HtmlInlineType>
  & HtmlInlineMatchPhaseStateData


/**
 * State on post-match phase of HtmlInlineTokenizer
 */
export type HtmlInlinePostMatchPhaseState =
  & InlineTokenizerPostMatchPhaseState<HtmlInlineType>
  & HtmlInlineMatchPhaseStateData


/**
 * State data of match phase of HtmlInlineTokenizer
 */
export type HtmlInlineMatchPhaseStateData =
  | HtmlInlineOpenMatchPhaseData
  | HtmlInlineClosingMatchPhaseStateData
  | HtmlInlineCommentMatchPhaseData
  | HtmlInlineInstructionMatchPhaseStateData
  | HtmlInlineDeclarationMatchPhaseData
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
