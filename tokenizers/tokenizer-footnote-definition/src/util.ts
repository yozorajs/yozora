import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, VirtualCodePoint, isWhitespaceCharacter } from '@yozora/character'

const maxLabelContentLength = 999

/**
 * Try to match a footnote label.
 *
 * Unlike the link label, the footnote label should be on the same line and it
 * begins with a left bracket ([) followed by a caret (^), and ends with the
 * first right bracket (]) that is not backslash-escaped. Between the caret of
 * right bracket, there must be at least one non-whitespace character.
 * Unescaped square bracket characters are not allowed inside the opening
 * and closing square bracket of footnote labels. A footnote label can have at
 * most 999 characters inside the caret and right bracket.
 *
 * @param nodePoints
 * @param firstNonWhitespaceIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#link-label
 */
export function eatFootnoteLabel(
  nodePoints: readonly INodePoint[],
  firstNonWhitespaceIndex: number,
  endIndex: number,
): number {
  let i = firstNonWhitespaceIndex

  // Try to match an opening delimiter of a footnote label.
  if (
    i + 1 >= endIndex ||
    nodePoints[i].codePoint !== AsciiCodePoint.OPEN_BRACKET ||
    nodePoints[i + 1].codePoint !== AsciiCodePoint.CARET
  ) {
    return -1
  }

  let isEmpty = true
  const firstContentIndex = i + 2
  const lastIndex = Math.min(endIndex, firstContentIndex + maxLabelContentLength + 1)
  for (i = firstContentIndex; i < lastIndex; ++i) {
    const c = nodePoints[i].codePoint
    switch (c) {
      case AsciiCodePoint.BACKSLASH:
        isEmpty = false
        i += 1
        if (i >= endIndex || nodePoints[i].codePoint === VirtualCodePoint.LINE_END) return -1
        break
      case AsciiCodePoint.OPEN_BRACKET:
        return -1
      case AsciiCodePoint.CLOSE_BRACKET:
        return isEmpty ? -1 : i + 1
      case VirtualCodePoint.LINE_END:
        return -1
      default:
        if (isEmpty && !isWhitespaceCharacter(c)) {
          isEmpty = false
        }
    }
  }

  return -1
}
