import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPostMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof InlineHtmlComment
 */
export const InlineHtmlCommentType = 'inlineHtmlComment'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type InlineHtmlCommentType = typeof InlineHtmlCommentType


/**
 * 内联 html 注释
 * An HTML comment consists of '<!--' + text + '-->',
 * where text does not start with '>' or '->', does not end with '-', and does not contain '--'.
 *
 * @example
 *    ````markdown
 *    foo <!-- this is a
 *    comment - with hyphen -->
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'paragraph',
 *      children: [
 *        { type: 'text', value: 'foo ' },
 *        { type: 'inlineHtmlComment', value: ' this is a\ncomment - with hyphen ' }
 *      ]
 *    }
 *    ```
 * @see https://github.github.com/gfm/#html-comment
 */
export interface InlineHtmlComment extends
  YastInlineNode<InlineHtmlCommentType>,
  InlineTokenizerParsePhaseState<InlineHtmlCommentType> {
  /**
   * html 注释内容
   * content of InlineHTMLComment
   */
  value: string
}


/**
 * State on match phase of InlineHtmlCommentTokenizer
 */
export type InlineHtmlCommentMatchPhaseState =
  & InlineTokenizerMatchPhaseState<InlineHtmlCommentType>
  & InlineHtmlCommentMatchPhaseStateData


/**
 * State on post-match phase of InlineHtmlCommentTokenizer
 */
export type InlineHtmlCommentPostMatchPhaseState =
  & InlineTokenizerPostMatchPhaseState<InlineHtmlCommentType>
  & InlineHtmlCommentMatchPhaseStateData


/**
 * State of match phase of InlineHtmlCommentTokenizer
 */
export interface InlineHtmlCommentMatchPhaseStateData {
  /**
   * Start/Left Delimiter of InlineHtmlCommentToken
   */
  openerDelimiter: InlineHtmlCommentTokenDelimiter
  /**
   * End/Right Delimiter of InlineHtmlCommentToken
   */
  closerDelimiter: InlineHtmlCommentTokenDelimiter
}


/**
 * Delimiter of InlineHtmlCommentToken
 */
export interface InlineHtmlCommentTokenDelimiter extends InlineTokenDelimiter {

}
