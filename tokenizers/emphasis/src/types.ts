import type {
  YastParent,
  YastToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

/**
 * typeof EmphasisItalic
 */
export const EmphasisItalicType = 'emphasis'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type EmphasisItalicType = typeof EmphasisItalicType

/**
 * typeof EmphasisStrong
 */
export const EmphasisStrongType = 'strong'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type EmphasisStrongType = typeof EmphasisStrongType

export type EmphasisType = EmphasisItalicType | EmphasisStrongType

/**
 * 粗体；强调的内容
 * Emphasis represents stress emphasis of its contents.
 *
 * @example
 *    ````markdown
 *    *alpha* _bravo_ **alpha** __bravo__
 *    ````
 *    ===>
 *    ```json
 *    [
 *      {
 *        "type": "emphasis",
 *        "children": [
 *          { "type": "text", "value": "alpha" }
 *        ]
 *      },
 *      { "type": "text", "value": " " },
 *      {
 *        "type": "emphasis",
 *        "children": [
 *          { "type": "text", "value": "bravo" }
 *        ]
 *      },
 *      {
 *        "type": "strong",
 *        "children": [
 *          { "type": "text", "value": "alpha" }
 *        ]
 *      },
 *      { "type": "text", "value": " " },
 *      {
 *        "type": "strong",
 *        "children": [
 *          { "type": "text", "value": "bravo" }
 *        ]
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#strong
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 */
export type Emphasis = YastParent<EmphasisType>

/**
 * An emphasis / strong token.
 */
export interface EmphasisToken extends YastToken<EmphasisType> {
  /**
   * Delimiter thickness.
   */
  thickness: number
}

/**
 * Delimiter of emphasis token.
 */
export interface EmphasisTokenDelimiter extends YastTokenDelimiter {
  /**
   * Thickness of the delimiter.
   */
  thickness: number
  /**
   * The original thickness of the delimiter.
   */
  originalThickness: number
}
