import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import {
  eatHTMLAttribute,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizercore'


const excludedTags = ['pre', 'script', 'style']


/**
 * Eat block html start condition 7:
 *
 *    line begins with a complete open tag (with any tag name
 *    other than `script`, `style`, or `pre`) or a complete closing tag,
 *    followed only by whitespace or the end of the line
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#start-condition
 */
export function eatStartCondition7(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
  tagName: string,
  potentialOpenTag: boolean,
): number | null {
  if (
    excludedTags.includes(tagName) ||
    startIndex >= endIndex
  ) return null

  let i = startIndex

  if (potentialOpenTag) { // Try to resolve an open tag.
    for (; i < endIndex;) {
      const result = eatHTMLAttribute(nodePoints, i, endIndex)
      if (result == null) break
      i = result.nextIndex
    }

    i = eatOptionalWhiteSpaces(nodePoints, i, endIndex)
    if (i >= endIndex) return null

    if (nodePoints[i].codePoint === AsciiCodePoint.FORWARD_SLASH) i += 1
  } else { // Try to resolve a closing tag.
    i = eatOptionalWhiteSpaces(nodePoints, startIndex, endIndex)
  }

  if (
    i >= endIndex ||
    nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE
  ) return null

  for (i += 1; i < endIndex; ++i) {
    if (!isWhiteSpaceCharacter(nodePoints[i].codePoint)) return null
  }
  return endIndex
}
