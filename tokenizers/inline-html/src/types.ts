import type {
  InlineTokenizerMatchPhaseState,
  InlineTokenizerPostMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'
import type {
  InlineHtmlCDataDelimiter,
  InlineHtmlCDataMatchPhaseStateData,
  InlineHtmlCDataTagType,
} from './util/cdata'
import type {
  InlineHtmlClosingDelimiter,
  InlineHtmlClosingMatchPhaseStateData,
  InlineHtmlClosingTagType,
} from './util/closing'
import type {
  InlineHtmlCommentDelimiter,
  InlineHtmlCommentMatchPhaseData,
  InlineHtmlCommentTagType,
} from './util/comment'
import type {
  InlineHtmlDeclarationDelimiter,
  InlineHtmlDeclarationMatchPhaseData,
  InlineHtmlDeclarationTagType,
} from './util/declaration'
import type {
  InlineHtmlInstructionDelimiter,
  InlineHtmlInstructionMatchPhaseStateData,
  InlineHtmlInstructionTagType,
} from './util/instruction'
import type {
  InlineHtmlOpenDelimiter,
  InlineHtmlOpenMatchPhaseData,
  InlineHtmlOpenTagType,
} from './util/open'


/**
 * typeof InlineHtml
 */
export const InlineHtmlType = 'inlineHtml'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type InlineHtmlType = typeof InlineHtmlType


export type InlineHtmlTagType =
  | InlineHtmlOpenTagType
  | InlineHtmlClosingTagType
  | InlineHtmlCommentTagType
  | InlineHtmlInstructionTagType
  | InlineHtmlDeclarationTagType
  | InlineHtmlCDataTagType


/**
 *
 * @example
 *    ````markdown
 *    ````
 *    ===>
 *    ```js
 *    ```
 */
export interface InlineHtml extends YastInlineNode<InlineHtmlType> {
  /**
   * Inner HTML tag type
   * @see https://github.github.com/gfm/#html-tag
   */
  tagType: InlineHtmlTagType
}


/**
 * State on match phase of InlineHtmlTokenizer
 */
export type InlineHtmlMatchPhaseState =
  & InlineTokenizerMatchPhaseState<InlineHtmlType>
  & InlineHtmlMatchPhaseStateData


/**
 * State on post-match phase of InlineHtmlTokenizer
 */
export type InlineHtmlPostMatchPhaseState =
  & InlineTokenizerPostMatchPhaseState<InlineHtmlType>
  & InlineHtmlMatchPhaseStateData


/**
 * State data of match phase of InlineHtmlTokenizer
 */
export type InlineHtmlMatchPhaseStateData =
  | InlineHtmlOpenMatchPhaseData
  | InlineHtmlClosingMatchPhaseStateData
  | InlineHtmlCommentMatchPhaseData
  | InlineHtmlInstructionMatchPhaseStateData
  | InlineHtmlDeclarationMatchPhaseData
  | InlineHtmlCDataMatchPhaseStateData


/**
 * Delimiter of InlineHtmlToken
 */
export type InlineHtmlTokenDelimiter =
  | InlineHtmlOpenDelimiter
  | InlineHtmlClosingDelimiter
  | InlineHtmlCommentDelimiter
  | InlineHtmlInstructionDelimiter
  | InlineHtmlDeclarationDelimiter
  | InlineHtmlCDataDelimiter
