import type {
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof InlineHtmlComment
 */
export const InlineHtmlCommentType = 'INLINE_HTML_COMMENT'
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
 *      type: 'PARAGRAPH',
 *      children: [
 *        { type: 'TEXT', value: 'foo ' },
 *        { type: 'INLINE_HTML_COMMENT', value: ' this is a\ncomment - with hyphen ' }
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
   * content of InlineHTMLCommentDataNode
   */
  value: string
}


/**
 * Delimiter of InlineHtmlCommentToken
 */
export interface InlineHtmlCommentTokenDelimiter
  extends InlineTokenDelimiter<'opener' | 'both' | 'closer'> {

}


/**
 * Potential token of InlineHtmlComment
 */
export interface InlineHtmlCommentPotentialToken
  extends InlinePotentialToken<InlineHtmlCommentType, InlineHtmlCommentTokenDelimiter> {
  /**
   * Start/Left Delimiter of InlineHtmlCommentToken
   */
  openerDelimiter: InlineHtmlCommentTokenDelimiter
  /**
   * End/Right Delimiter of InlineHtmlCommentToken
   */
  closerDelimiter: InlineHtmlCommentTokenDelimiter
  /**
   * Internal raw content fragments
   */
  innerRawContents: Exclude<InlinePotentialToken['innerRawContents'], undefined>
}


/**
 * State of match phase of InlineHtmlCommentTokenizer
 */
export interface InlineHtmlCommentMatchPhaseState
  extends InlineTokenizerMatchPhaseState<InlineHtmlCommentType> {
  /**
   * Start/Left Delimiter of InlineHtmlCommentToken
   */
  openerDelimiter: InlineHtmlCommentTokenDelimiter
  /**
   * End/Right Delimiter of InlineHtmlCommentToken
   */
  closerDelimiter: InlineHtmlCommentTokenDelimiter
}
