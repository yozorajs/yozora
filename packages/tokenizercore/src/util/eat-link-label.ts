// eslint-disable-next-line @typescript-eslint/triple-slash-reference
import type { EnhancedYastNodePoint } from '../types/node'
import foldCase from 'fold-case'
import {
  AsciiCodePoint,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import { eatOptionalWhiteSpaces } from './eat'


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
 * @see https://github.github.com/gfm/#link-label
 * @return position at next iteration
 */
export function eatLinkLabel(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): number {
  let i = startIndex, hasNonWhiteSpaceCharacter = false, t = 0
  if (
    i + 1 >= endIndex ||
    nodePoints[i].codePoint !== AsciiCodePoint.OPEN_BRACKET
  ) {
    return -1
  }

  const updateHasNonWhiteSpaceCharacter = (k: number): void => {
    if (hasNonWhiteSpaceCharacter || k >= endIndex) return
    const p = nodePoints[k]
    hasNonWhiteSpaceCharacter = !isUnicodeWhiteSpaceCharacter(p.codePoint)
  }

  for (i += 1; i < endIndex && t < 999; i += 1, t += 1) {
    const p = nodePoints[i]
    switch (p.codePoint) {
      case AsciiCodePoint.BACK_SLASH:
        i += 1
        updateHasNonWhiteSpaceCharacter(i)
        break
      case AsciiCodePoint.OPEN_BRACKET:
        return -1
      case AsciiCodePoint.CLOSE_BRACKET:
        /**
         * A link label must contain at least one non-whitespace character
         *
         * @see https://github.github.com/gfm/#example-559
         * @see https://github.github.com/gfm/#example-560
         */
        if (i === startIndex || hasNonWhiteSpaceCharacter) return i + 1
        return -1
      default:
        updateHasNonWhiteSpaceCharacter(i)
    }
  }
  return -1
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
  nodePoints: EnhancedYastNodePoint[]
  /**
   * Does it contain non-blank characters
   */
  hasNonWhiteSpaceCharacter: boolean
}


/**
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @param state
 * @see https://github.github.com/gfm/#link-label
 */
export function eatAndCollectLinkLabel(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
  state: LinkLabelCollectingState | null,
): { nextIndex: number, state: LinkLabelCollectingState } {
  let i = startIndex

  // init state
  if (state == null) {
    // eslint-disable-next-line no-param-reassign
    state = {
      saturated: false,
      nodePoints: [],
      hasNonWhiteSpaceCharacter: false,
    }
  }

  /**
   * Although link label may span multiple lines,
   * they may not contain a blank line.
   */
  const firstNonWhiteSpaceIndex = eatOptionalWhiteSpaces(nodePoints, i, endIndex)
  if (firstNonWhiteSpaceIndex >= endIndex) return { nextIndex: -1, state }

  if (state.nodePoints.length <= 0) {
    i = firstNonWhiteSpaceIndex

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
      case AsciiCodePoint.BACK_SLASH:
        // eslint-disable-next-line no-param-reassign
        state.hasNonWhiteSpaceCharacter = true
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
        if (state.hasNonWhiteSpaceCharacter) {
          // eslint-disable-next-line no-param-reassign
          state.saturated = true
          return { nextIndex: i + 1, state }
        }
        return { nextIndex: -1, state }
      default:
        if (!isUnicodeWhiteSpaceCharacter(p.codePoint)) {
          // eslint-disable-next-line no-param-reassign
          state.hasNonWhiteSpaceCharacter = true
        }
        state.nodePoints.push(p)
    }
  }

  return { nextIndex: 1, state }
}


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
  const identifier = label
    .trim()
    .replace(/\s+/, ' ')
    .toLowerCase()
  return foldCase(identifier)
}
