import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import {
  eatOptionalBlankLines,
  eatOptionalWhitespaces,
} from '@yozora/tokenizercore'


/**
 * The processing state of eatAndCollectLinkDestination, used to save
 * intermediate data to support multiple codePosition fragment processing.
 *
 * @see https://github.github.com/gfm/#link-title
 */
export interface LinkTitleCollectingState {
  /**
   * Whether the current state has collected a legal LinkDestination
   */
  saturated: boolean
  /**
   * Collected token points
   */
  nodePoints: NodePoint[]
  /**
   * Character that wrap link-title
   */
  wrapSymbol: number | null
  /**
   * Number of parentheses encountered
   */
  openParensCount: number
}


/**
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @param state
 * @see https://github.github.com/gfm/#link-title
 */
export function eatAndCollectLinkTitle(
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
  state: LinkTitleCollectingState | null,
): { nextIndex: number, state: LinkTitleCollectingState } {
  let i = startIndex

  // init state
  if (state == null) {
    // eslint-disable-next-line no-param-reassign
    state = {
      saturated: false,
      nodePoints: [],
      wrapSymbol: null,
      openParensCount: 0,
    }
  }

  /**
   * Although link titles may span multiple lines,
   * they may not contain a blank line.
   */
  const firstNonWhitespaceIndex = eatOptionalWhitespaces(nodePoints, i, endIndex)
  if (firstNonWhitespaceIndex >= endIndex) return { nextIndex: -1, state }

  if (state.nodePoints.length <= 0) {
    i = firstNonWhitespaceIndex
    const p = nodePoints[i]
    if (
      p.codePoint === AsciiCodePoint.DOUBLE_QUOTE ||
      p.codePoint === AsciiCodePoint.SINGLE_QUOTE
    ) {
      // eslint-disable-next-line no-param-reassign
      state.wrapSymbol = p.codePoint
      state.nodePoints.push(p)
      i += 1

    } else if (p.codePoint === AsciiCodePoint.OPEN_PARENTHESIS) {
      // eslint-disable-next-line no-param-reassign
      state.openParensCount = 1
      i += 1
    } else {
      return { nextIndex: -1, state }
    }
  }

  if (state.wrapSymbol == null) return { nextIndex: -1, state }

  switch (state.wrapSymbol) {
    /**
     *  - a sequence of zero or more characters between straight double-quote characters '"',
     *    including a '"' character only if it is backslash-escaped, or
     *  - a sequence of zero or more characters between straight single-quote characters '\'',
     *    including a '\'' character only if it is backslash-escaped,
     */
    case AsciiCodePoint.DOUBLE_QUOTE:
    case AsciiCodePoint.SINGLE_QUOTE: {
      for (i; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACKSLASH:
            if (i + 1 < endIndex) {
              state.nodePoints.push(p)
              state.nodePoints.push(nodePoints[i + 1])
            }
            i += 1
            break
          case state.wrapSymbol:
            // eslint-disable-next-line no-param-reassign
            state.saturated = true
            state.nodePoints.push(p)
            return { nextIndex: i + 1, state }
          /**
           * Link titles may span multiple lines
           */
          case AsciiCodePoint.LF: {
            state.nodePoints.push(p)
            return { nextIndex: i + 1, state }
          }
          default:
            state.nodePoints.push(p)
        }
      }
      break
    }
    /**
     * a sequence of zero or more characters between matching parentheses '((...))',
     * including a '(' or ')' character only if it is backslash-escaped.
     */
    case AsciiCodePoint.OPEN_PARENTHESIS: {
      for (i += 1; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACKSLASH:
            if (i + 1 < endIndex) {
              state.nodePoints.push(p)
              state.nodePoints.push(nodePoints[i + 1])
            }
            i += 1
            break
          /**
           * Although link titles may span multiple lines, they may not contain a blank line.
           */
          case AsciiCodePoint.LF: {
            state.nodePoints.push(p)
            const j = eatOptionalBlankLines(nodePoints, startIndex, i)
            if (nodePoints[j].line > p.line + 1) {
              return { nextIndex: -1, state }
            }
            break
          }
          case AsciiCodePoint.OPEN_PARENTHESIS:
            // eslint-disable-next-line no-param-reassign
            state.openParensCount += 1
            state.nodePoints.push(p)
            break
          case AsciiCodePoint.CLOSE_PARENTHESIS:
            // eslint-disable-next-line no-param-reassign
            state.openParensCount -= 1
            state.nodePoints.push(p)
            if (state.openParensCount === 0) {
              // eslint-disable-next-line no-param-reassign
              state.saturated = true
              return { nextIndex: i + 1, state }
            }
            break
          default:
            state.nodePoints.push(p)
        }
      }
      break
    }
  }

  return { nextIndex: -1, state }
}
