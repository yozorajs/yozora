import type { NodePoint } from '@yozora/character'
import foldCase from 'fold-case'
import {
  AsciiCodePoint,
  calcStringFromNodePoints,
  isWhitespaceCharacter,
} from '@yozora/character'
import { eatOptionalWhitespaces } from '@yozora/core-tokenizer'

/**
 * One label matches another just in case their normalized forms are equal.
 * To normalize a label, strip off the opening and closing brackets, perform
 * the Unicode case fold, strip leading and trailing whitespace and collapse
 * consecutive internal whitespace to a single space. If there are multiple
 * matching reference link definitions, the one that comes first in the
 * document is used. (It is desirable in such cases to emit a warning.)
 * @see https://github.github.com/gfm/#link-label
 */
export function resolveLabelToIdentifier(label: string): string {
  const identifier = label.trim().replace(/\s+/, ' ').toLowerCase()
  return foldCase(identifier)
}

/**
 * Resolve a link label and link definition identifier.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#link-label
 */
export function resolveLinkLabelAndIdentifier(
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
): { label: string; identifier: string } | null {
  const label = calcStringFromNodePoints(nodePoints, startIndex, endIndex, true)

  /**
   * A link label must contain at least one non-whitespace character
   * @see https://github.github.com/gfm/#example-559
   * @see https://github.github.com/gfm/#example-560
   */
  if (label.length <= 0) return null

  const identifier = resolveLabelToIdentifier(label)
  if (identifier == null) return null

  return { label, identifier }
}

/**
 * The processing state of eatAndCollectLinkLabel, used to save
 * intermediate data to support multiple codePosition fragment processing
 *
 * @see https://github.github.com/gfm/#link-label
 */
export interface LinkLabelCollectingState {
  /**
   * Whether the current state has collected a legal LinkDestination
   */
  saturated: boolean
  /**
   * Collected token points
   */
  nodePoints: NodePoint[]
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
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
  state: LinkLabelCollectingState | null,
): { nextIndex: number; state: LinkLabelCollectingState } {
  let i = startIndex

  // init state
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
  const firstNonWhitespaceIndex = eatOptionalWhitespaces(
    nodePoints,
    i,
    endIndex,
  )
  if (firstNonWhitespaceIndex >= endIndex) return { nextIndex: -1, state }

  if (state.nodePoints.length <= 0) {
    i = firstNonWhitespaceIndex

    // check whether in brackets
    const p = nodePoints[i]
    if (p.codePoint !== AsciiCodePoint.OPEN_BRACKET) {
      return { nextIndex: -1, state }
    }

    i += 1
    // eslint-disable-next-line no-param-reassign
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
        return { nextIndex: -1, state }
      case AsciiCodePoint.CLOSE_BRACKET:
        state.nodePoints.push(p)
        if (state.hasNonWhitespaceCharacter) {
          // eslint-disable-next-line no-param-reassign
          state.saturated = true
          return { nextIndex: i + 1, state }
        }
        return { nextIndex: -1, state }
      default:
        if (!isWhitespaceCharacter(p.codePoint)) {
          // eslint-disable-next-line no-param-reassign
          state.hasNonWhitespaceCharacter = true
        }
        state.nodePoints.push(p)
    }
  }

  return { nextIndex: 1, state }
}
