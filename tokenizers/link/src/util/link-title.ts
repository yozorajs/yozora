import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint, VirtualCodePoint } from '@yozora/character'
import { eatOptionalBlankLines } from '@yozora/core-tokenizer'

/**
 * A link title consists of either
 *
 *   - a sequence of zero or more characters between straight double-quote
 *     characters '"', including a '"' character only if it is backslash-escaped, or
 *
 *   - a sequence of zero or more characters between straight single-quote
 *     characters '\'', including a '\'' character only if it is backslash-escaped, or
 *
 *   - a sequence of zero or more characters between matching parentheses '(...)',
 *     including a '(' or ')' character only if it is backslash-escaped.
 */
export function eatLinkTitle(
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
): number {
  let i = startIndex
  const titleWrapSymbol = nodePoints[i].codePoint
  switch (titleWrapSymbol) {
    case AsciiCodePoint.DOUBLE_QUOTE:
    case AsciiCodePoint.SINGLE_QUOTE: {
      for (i += 1; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACKSLASH:
            i += 1
            break
          case titleWrapSymbol:
            return i + 1
          /**
           * Although link titles may span multiple lines, they may not contain a blank line.
           */
          case VirtualCodePoint.LINE_END: {
            const j = eatOptionalBlankLines(nodePoints, startIndex, i)
            if (nodePoints[j].line > p.line + 1) return -1
            break
          }
        }
      }
      break
    }
    case AsciiCodePoint.OPEN_PARENTHESIS: {
      let openParens = 1
      for (i += 1; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACKSLASH:
            i += 1
            break
          /**
           * Although link titles may span multiple lines, they may not contain a blank line.
           */
          case VirtualCodePoint.LINE_END: {
            const j = eatOptionalBlankLines(nodePoints, startIndex, i)
            if (nodePoints[j].line > p.line + 1) return -1
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
