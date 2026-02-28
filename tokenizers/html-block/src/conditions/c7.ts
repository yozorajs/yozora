import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, isWhitespaceCharacter } from '@yozora/character'
import { eatOptionalWhitespaces } from '@yozora/core-tokenizer'
import { eatHTMLAttribute } from '../util/eat-html-attribute'

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
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
  tagName: string,
  potentialOpenTag: boolean,
): number | null {
  if (excludedTags.includes(tagName) || startIndex >= endIndex) return null

  let i = startIndex

  if (potentialOpenTag) {
    // Try to resolve an open tag.
    for (; i < endIndex; ) {
      const result = eatHTMLAttribute(nodePoints, i, endIndex)
      if (result == null) break
      i = result.nextIndex
    }

    i = eatOptionalWhitespaces(nodePoints, i, endIndex)
    if (i >= endIndex) return null

    if (nodePoints[i].codePoint === AsciiCodePoint.SLASH) i += 1
  } else {
    // Try to resolve a closing tag.
    i = eatOptionalWhitespaces(nodePoints, startIndex, endIndex)
  }

  if (i >= endIndex || nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE) return null

  for (i += 1; i < endIndex; ++i) {
    if (!isWhitespaceCharacter(nodePoints[i].codePoint)) return null
  }
  return endIndex
}
