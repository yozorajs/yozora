import type { NodeInterval, NodePoint } from '@yozora/character'
import type { YastTokenDelimiter } from '@yozora/tokenizercore-inline'
import {
  AsciiCodePoint,
  isAsciiUpperLetter,
  isWhitespaceCharacter,
} from '@yozora/character'


export interface HtmlInlineDeclarationData {
  htmlType: 'declaration'
}


export interface HtmlInlineDeclarationTokenData {
  htmlType: 'declaration'
  tagName: NodeInterval
}


export interface HtmlInlineDeclarationDelimiter
  extends YastTokenDelimiter, HtmlInlineDeclarationTokenData {
  type: 'full'
}


/**
 * A declaration consists of the string `<!`, a name consisting of one or more
 * uppercase ASCII letters, whitespace, a string of characters not including
 * the character `>`, and the character `>`.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#declaration
 */
export function eatHtmlInlineDeclarationDelimiter(
  nodePoints: ReadonlyArray<NodePoint>,
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
    !isWhitespaceCharacter(nodePoints[i].codePoint)
  ) return null

  const tagNameEndIndex = i, si = i + 1
  for (i = si; i < endIndex; ++i) {
    const p = nodePoints[i]
    if (p.codePoint === AsciiCodePoint.CLOSE_ANGLE) {
      const delimiter: HtmlInlineDeclarationDelimiter = {
        type: 'full',
        startIndex,
        endIndex: i + 1,
        htmlType: 'declaration',
        tagName: {
          startIndex: tagNameStartIndex,
          endIndex: tagNameEndIndex,
        },
      }
      return delimiter
    }
  }
  return null
}
