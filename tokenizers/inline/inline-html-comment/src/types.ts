import {
  InlineDataNode,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof InlineHtmlCommentDataNode
 */
export const InlineHtmlCommentDataNodeType = 'INLINE_HTML_COMMENT'
export type InlineHtmlCommentDataNodeType = typeof InlineHtmlCommentDataNodeType


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
export interface InlineHtmlCommentDataNode extends
  InlineDataNode<InlineHtmlCommentDataNodeType>,
  InlineTokenizerParsePhaseState<InlineHtmlCommentDataNodeType> {
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
  extends InlinePotentialToken<InlineHtmlCommentDataNodeType, InlineHtmlCommentTokenDelimiter> {
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
 * State of pre-match phase of InlineHtmlCommentTokenizer
 */
export interface InlineHtmlCommentPreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<InlineHtmlCommentDataNodeType> {
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
 * State of match phase of InlineHtmlCommentTokenizer
 */
export interface InlineHtmlCommentMatchPhaseState
  extends InlineTokenizerMatchPhaseState<InlineHtmlCommentDataNodeType> {
  /**
   * Start/Left Delimiter of InlineHtmlCommentToken
   */
  openerDelimiter: InlineHtmlCommentTokenDelimiter
  /**
   * End/Right Delimiter of InlineHtmlCommentToken
   */
  closerDelimiter: InlineHtmlCommentTokenDelimiter
}
