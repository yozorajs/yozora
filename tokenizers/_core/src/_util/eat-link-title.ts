import { AsciiCodePoint } from '@yozora/character'
import { DataNodeTokenPointDetail } from '../_types/token'
import { eatOptionalBlankLines, eatOptionalWhiteSpaces } from './eat'


/**
  * A link title consists of either
  * - a sequence of zero or more characters between straight double-quote characters '"',
  *   including a '"' character only if it is backslash-escaped, or
  * - a sequence of zero or more characters between straight single-quote characters '\'',
  *   including a '\'' character only if it is backslash-escaped, or
  * - a sequence of zero or more characters between matching parentheses '(...)',
  *   including a '(' or ')' character only if it is backslash-escaped.
  *
  * Although link titles may span multiple lines, they may not contain a blank line.
  */
export function eatLinkTitle(
  codePositions: DataNodeTokenPointDetail[],
  startIndex: number,
  endIndex: number,
): number {
  let i = startIndex
  const titleWrapSymbol = codePositions[i].codePoint
  switch (titleWrapSymbol) {
    /**
     *  - a sequence of zero or more characters between straight double-quote characters '"',
     *    including a '"' character only if it is backslash-escaped, or
     *  - a sequence of zero or more characters between straight single-quote characters '\'',
     *    including a '\'' character only if it is backslash-escaped,
     */
    case AsciiCodePoint.DOUBLE_QUOTE:
    case AsciiCodePoint.SINGLE_QUOTE: {
      for (i += 1; i < endIndex; ++i) {
        const p = codePositions[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            i += 1
            break
          case titleWrapSymbol:
            return i + 1
          /**
           * Although link titles may span multiple lines, they may not contain a blank line.
           */
          case AsciiCodePoint.LINE_FEED: {
            const j = eatOptionalBlankLines(codePositions, startIndex, i)
            if (codePositions[j].line > p.line + 1) return -1
            break
          }
        }
      }
      break
    }
    /**
     * a sequence of zero or more characters between matching parentheses '((...))',
     * including a '(' or ')' character only if it is backslash-escaped.
     */
    case AsciiCodePoint.OPEN_PARENTHESIS: {
      let openParens = 1
      for (i += 1; i < endIndex; ++i) {
        const p = codePositions[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            i += 1
            break
          /**
           * Although link titles may span multiple lines, they may not contain a blank line.
           */
          case AsciiCodePoint.LINE_FEED: {
            const j = eatOptionalBlankLines(codePositions, startIndex, i)
            if (codePositions[j].line > p.line + 1) return -1
            break
          }
          case AsciiCodePoint.OPEN_PARENTHESIS:
            openParens += 1
            break
          case AsciiCodePoint.CLOSE_PARENTHESIS:
            openParens -= 1
            if (openParens === 0) return i + 1
            break
        }
      }
      break
    }
    case AsciiCodePoint.CLOSE_PARENTHESIS:
      return i
    default:
      return -1
  }
  return -1
}


/**
 * The processing state of eatAndCollectLinkDestination, used to save
 * intermediate data to support multiple codePosition fragment processing
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
  codePositions: DataNodeTokenPointDetail[]
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
 * @param codePositions
 * @param startIndex
 * @param endIndex
 * @param state
 * @see https://github.github.com/gfm/#link-title
 */
export function eatAndCollectLinkTitle(
  codePositions: DataNodeTokenPointDetail[],
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
      codePositions: [],
      wrapSymbol: null,
      openParensCount: 0,
    }
  }

  /**
   * Although link titles may span multiple lines, they may not contain
   * a blank line.
   */
  const firstNonWhiteSpaceIndex = eatOptionalWhiteSpaces(codePositions, i, endIndex)
  if (firstNonWhiteSpaceIndex >= endIndex) return { nextIndex: -1, state }

  if (state.codePositions.length <= 0) {
    i = firstNonWhiteSpaceIndex
    const c = codePositions[i]
    if (
      c.codePoint === AsciiCodePoint.DOUBLE_QUOTE ||
      c.codePoint === AsciiCodePoint.SINGLE_QUOTE
    ) {
      // eslint-disable-next-line no-param-reassign
      state.wrapSymbol = c.codePoint
      state.codePositions.push(c)
      i += 1

    } else if (c.codePoint === AsciiCodePoint.OPEN_PARENTHESIS) {
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
        const c = codePositions[i]
        switch (c.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            state.codePositions.push(c)
            if (i + 1 < endIndex) {
              state.codePositions.push(codePositions[i + 1])
            }
            i += 1
            break
          case state.wrapSymbol:
            // eslint-disable-next-line no-param-reassign
            state.saturated = true
            state.codePositions.push(c)
            return { nextIndex: i + 1, state }
          /**
           * Link titles may span multiple lines
           */
          case AsciiCodePoint.LINE_FEED: {
            state.codePositions.push(c)
            return { nextIndex: i + 1, state }
          }
          default:
            state.codePositions.push(c)
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
        const c = codePositions[i]
        switch (c.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            state.codePositions.push(c)
            if (i + 1 < endIndex) {
              state.codePositions.push(codePositions[i + 1])
            }
            i += 1
            break
          /**
           * Although link titles may span multiple lines, they may not contain a blank line.
           */
          case AsciiCodePoint.LINE_FEED: {
            state.codePositions.push(c)
            const j = eatOptionalBlankLines(codePositions, startIndex, i)
            if (codePositions[j].line > c.line + 1) {
              return { nextIndex: -1, state }
            }
            break
          }
          case AsciiCodePoint.OPEN_PARENTHESIS:
            // eslint-disable-next-line no-param-reassign
            state.openParensCount += 1
            state.codePositions.push(c)
            break
          case AsciiCodePoint.CLOSE_PARENTHESIS:
            // eslint-disable-next-line no-param-reassign
            state.openParensCount -= 1
            state.codePositions.push(c)
            if (state.openParensCount === 0) {
              // eslint-disable-next-line no-param-reassign
              state.saturated = true
              return { nextIndex: i + 1, state }
            }
            break
          default:
            state.codePositions.push(c)
        }
      }
      break
    }
  }

  return { nextIndex: -1, state }
}
