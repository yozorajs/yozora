import type {
  EnhancedYastNodePoint,
  YastLiteral,
  YastNodeInterval,
} from '@yozora/tokenizercore'
import type { InlineTokenDelimiter } from '@yozora/tokenizercore-inline'
import type { HtmlInline } from '../types'
import {
  AsciiCodePoint,
  isAsciiUpperLetter,
  isWhiteSpaceCharacter,
} from '@yozora/character'


export const HtmlInlineDeclarationTagType = 'declaration'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type HtmlInlineDeclarationTagType = typeof HtmlInlineDeclarationTagType


/**
 * A declaration consists of the string `<!`, a name consisting of one or more
 * uppercase ASCII letters, whitespace, a string of characters not including the
 * character `>`, and the character `>`.
 *
 * @see https://github.github.com/gfm/#declaration
 */
export interface HtmlInlineDeclaration extends HtmlInline, YastLiteral {
  tagType: HtmlInlineDeclarationTagType
  /**
   * Declaration name.
   */
  tagName: string
}


export interface HtmlInlineDeclarationMatchPhaseData {
  tagType: HtmlInlineDeclarationTagType
  tagName: YastNodeInterval
  content: YastNodeInterval
}


export interface HtmlInlineDeclarationDelimiter
  extends InlineTokenDelimiter, HtmlInlineDeclarationMatchPhaseData {
  type: 'full'
}


/**
 * Try to eating a declaration delimiter.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#declaration
 */
export function eatHtmlInlineDeclarationDelimiter(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): HtmlInlineDeclarationDelimiter | null {
  let i = startIndex
  if (
    i + 4 >= endIndex ||
    nodePoints[i + 1].codePoint !== AsciiCodePoint.EXCLAMATION_MARK
  ) return null

  const tagNameStartIndex = i + 2

  // Try to eating a declaration name.
  for (i = tagNameStartIndex; i < endIndex; ++i) {
    const p = nodePoints[i]
    if (!isAsciiUpperLetter(p.codePoint)) break
  }

  /**
   * If no uppercase name or a following whitespace exists,
   * then it's not a valid declaration.
   */
  if (
    i - tagNameStartIndex <= 0 ||
    i + 1 >= endIndex ||
    !isWhiteSpaceCharacter(nodePoints[i].codePoint)
  ) return null

  const tagNameEndIndex = i, si = i + 1
  for (i = si; i < endIndex; ++i) {
    const p = nodePoints[i]
    if (p.codePoint === AsciiCodePoint.CLOSE_ANGLE) {
      const delimiter: HtmlInlineDeclarationDelimiter = {
        type: 'full',
        tagType: HtmlInlineDeclarationTagType,
        startIndex,
        endIndex: i + 1,
        tagName: {
          startIndex: tagNameStartIndex,
          endIndex: tagNameEndIndex,
        },
        content: {
          startIndex: si,
          endIndex: i,
        }
      }
      return delimiter
    }
  }
  return null
}
