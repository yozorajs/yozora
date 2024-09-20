import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, isWhitespaceCharacter } from '@yozora/character'
import { eatOptionalWhitespaces } from '@yozora/core-tokenizer'

/**
 * The processing token of eatAndCollectLinkLabel, used to save
 * intermediate data to support multiple codePosition fragment processing
 *
 * @see https://github.github.com/gfm/#link-label
 */
export interface ILinkLabelCollectingState {
  /**
   * Whether the current token has collected a legal LinkDestination
   */
  saturated: boolean
  /**
   * Collected token points
   */
  nodePoints: INodePoint[]
  /**
   * Does it contain non-blank characters
   */
  hasNonWhitespaceCharacter: boolean
}

/**
 * A link label begins with a left bracket '[' and ends with the first right bracket ']'
 * that is not backslash-escaped. Between these brackets there must be at least one
 * non-whitespace character. Unescaped square bracket characters are not allowed inside
 * the opening and closing square brackets of link labels. A link label can have at most
 * 999 characters inside the square brackets.
 *
 * One label matches another just in case their normalized forms are equal. To normalize
 * a label, strip off the opening and closing brackets, perform the Unicode case fold,
 * strip leading and trailing whitespace and collapse consecutive internal whitespace to
 * a single space. If there are multiple matching reference link definitions, the one that
 * comes first in the document is used. (It is desirable in such cases to emit a warning.)
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @param state
 * @see https://github.github.com/gfm/#link-label
 */
export function eatAndCollectLinkLabel(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
  state: ILinkLabelCollectingState | null,
): { nextIndex: number; state: ILinkLabelCollectingState } {
  let i = startIndex

  // init token
  if (state == null) {
    // eslint-disable-next-line no-param-reassign
    state = {
      saturated: false,
      nodePoints: [],
      hasNonWhitespaceCharacter: false,
    }
  }

  /**
   * Although link label may span multiple lines,
   * they may not contain a blank line.
   */
  const firstNonWhitespaceIndex = eatOptionalWhitespaces(nodePoints, i, endIndex)
  if (firstNonWhitespaceIndex >= endIndex) return { nextIndex: -1, state: state }

  if (state.nodePoints.length <= 0) {
    i = firstNonWhitespaceIndex

    // check whether in brackets
    const p = nodePoints[i]
    if (p.codePoint !== AsciiCodePoint.OPEN_BRACKET) {
      return { nextIndex: -1, state: state }
    }

    i += 1

    state.nodePoints.push(p)
  }

  for (; i < endIndex; ++i) {
    const p = nodePoints[i]
    switch (p.codePoint) {
      case AsciiCodePoint.BACKSLASH:
        // eslint-disable-next-line no-param-reassign
        state.hasNonWhitespaceCharacter = true
        if (i + 1 < endIndex) {
          state.nodePoints.push(p)
          state.nodePoints.push(nodePoints[i + 1])
        }
        i += 1
        break
      case AsciiCodePoint.OPEN_BRACKET:
        return { nextIndex: -1, state: state }
      case AsciiCodePoint.CLOSE_BRACKET:
        state.nodePoints.push(p)
        if (state.hasNonWhitespaceCharacter) {
          // eslint-disable-next-line no-param-reassign
          state.saturated = true
          return { nextIndex: i + 1, state: state }
        }
        return { nextIndex: -1, state: state }
      default:
        if (!isWhitespaceCharacter(p.codePoint)) {
          // eslint-disable-next-line no-param-reassign
          state.hasNonWhitespaceCharacter = true
        }
        state.nodePoints.push(p)
    }
  }

  return { nextIndex: 1, state: state }
}
