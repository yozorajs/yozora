import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint, VirtualCodePoint } from '@yozora/character'
import { eatOptionalWhitespaces } from '@yozora/tokenizercore'

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
): { nextIndex: number; state: LinkTitleCollectingState } {
  let i = startIndex

  // init state
  if (state == null) {
    // eslint-disable-next-line no-param-reassign
    state = {
      saturated: false,
      nodePoints: [],
      wrapSymbol: null,
    }
  }

  /**
   * Although link titles may span multiple lines,
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
    const p = nodePoints[i]

    switch (p.codePoint) {
      case AsciiCodePoint.DOUBLE_QUOTE:
      case AsciiCodePoint.SINGLE_QUOTE:
      case AsciiCodePoint.OPEN_PARENTHESIS:
        // eslint-disable-next-line no-param-reassign
        state.wrapSymbol = p.codePoint
        state.nodePoints.push(p)
        i += 1
        break
      default:
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
      for (; i < endIndex; ++i) {
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
      for (; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACKSLASH:
            if (i + 1 < endIndex) {
              state.nodePoints.push(p)
              state.nodePoints.push(nodePoints[i + 1])
            }
            i += 1
            break
          case AsciiCodePoint.OPEN_PARENTHESIS:
            return { nextIndex: -1, state }
          case AsciiCodePoint.CLOSE_PARENTHESIS:
            if (
              i + 1 >= endIndex ||
              nodePoints[i + 1].codePoint === VirtualCodePoint.LINE_END
            ) {
              state.nodePoints.push(p)
              // eslint-disable-next-line no-param-reassign
              state.saturated = true
              break
            }
            return { nextIndex: -1, state }
          default:
            state.nodePoints.push(p)
        }
      }
      break
    }
  }

  return { nextIndex: endIndex, state }
}
