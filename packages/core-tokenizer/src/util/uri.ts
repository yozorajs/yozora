import { LinkReferenceType, LinkType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, calcStringFromNodePoints, foldCase } from '@yozora/character'
import type { IInlineToken } from '../types/token'

const hexDigits = '0123456789ABCDEF'
// ECMAScript `\s` includes Unicode whitespace that CommonMark labels preserve.
const linkLabelWhitespaceRegex = /[\t\n\v\f\r ]+/gu
const uriSafeCharacters = "-_.+!*'(),%#@?=;:/&$~"
const utf8Encoder = new TextEncoder()

/**
 * Encode link url.
 * @param destination
 */
export function encodeLinkDestination(destination: string): string {
  let result = ''

  for (const byte of utf8Encoder.encode(destination)) {
    const isAlphanumeric =
      (byte >= 0x30 && byte <= 0x39) ||
      (byte >= 0x41 && byte <= 0x5a) ||
      (byte >= 0x61 && byte <= 0x7a)
    const character = String.fromCharCode(byte)

    if (isAlphanumeric || uriSafeCharacters.includes(character)) {
      result += character
    } else {
      const highHexDigit = hexDigits[byte >> 4]
      const lowHexDigit = hexDigits[byte & 0x0f]
      result += `%${highHexDigit}${lowHexDigit}`
    }
  }

  return result
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
    .replace(linkLabelWhitespaceRegex, ' ')
    .replace(/^ /u, '')
    .replace(/ $/u, '')
    .toLowerCase()
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
  nodePoints: readonly INodePoint[],
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
  return { label, identifier }
}

/**
 * Try to eating a link label.
 *
 * nodePoints[startIndex] must be equaled to '['.codePointAt(0)
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @returns
 */
export function eatLinkLabel(
  nodePoints: readonly INodePoint[],
  startIndex: number,
  _endIndex: number,
): {
  nextIndex: number
  labelAndIdentifier: { label: string; identifier: string } | null
} {
  /**
   * A link label can have at most 999 characters inside the square
   * brackets.
   *
   * If there are more than 999 characters inside the square and all
   * of them are whitespaces, it will be handled incorrectly. But this
   * situation is too extreme, so I won’t consider it here.
   */
  let i = startIndex + 1
  const endIndex = Math.min(i + 1000, _endIndex)
  for (; i < endIndex; ++i) {
    const c = nodePoints[i].codePoint
    switch (c) {
      case AsciiCodePoint.BACKSLASH:
        i += 1
        break
      case AsciiCodePoint.OPEN_BRACKET:
        return { nextIndex: -1, labelAndIdentifier: null }
      case AsciiCodePoint.CLOSE_BRACKET: {
        /**
         * This is an empty square bracket pair, it's only could be part
         * of collapsed reference link
         *
         * A collapsed reference link consists of a link label that matches
         * a link reference definition elsewhere in the document, followed
         * by the string `[]`
         * @see https://github.github.com/gfm/#collapsed-link-reference
         *
         * A link label must contain at least one non-whitespace character
         * @see https://github.github.com/gfm/#example-559
         */
        const labelAndIdentifier = resolveLinkLabelAndIdentifier(nodePoints, startIndex + 1, i)
        return { nextIndex: i + 1, labelAndIdentifier }
      }
    }
  }

  return { nextIndex: -1, labelAndIdentifier: null }
}

/**
 * Test whether if the given token is a link type token.
 * @param token
 * @returns
 */
export function isLinkToken(token: IInlineToken): boolean {
  return token.nodeType === LinkType || token.nodeType === LinkReferenceType
}

/**
 * The link text may contain balanced brackets, but not unbalanced ones,
 * unless they are escaped. Brackets inside higher-priority inline tokens are
 * ignored.
 *
 * @param startIndex
 * @param endIndex
 * @param internalTokens
 * @param nodePoints
 * @returns -1 for an unexpected closing bracket, 0 if balanced, and 1 for an
 *          unclosed opening bracket.
 * @see https://github.github.com/gfm/#example-520
 * @see https://github.github.com/gfm/#example-521
 * @see https://github.github.com/gfm/#example-522
 * @see https://github.github.com/gfm/#example-523
 */
export function checkBalancedBracketsStatus(
  startIndex: number,
  endIndex: number,
  internalTokens: readonly IInlineToken[],
  nodePoints: readonly INodePoint[],
): -1 | 0 | 1 {
  let i = startIndex
  let bracketCount = 0

  const updateBracketCount = (): void => {
    const c = nodePoints[i].codePoint
    switch (c) {
      case AsciiCodePoint.BACKSLASH:
        i += 1
        break
      case AsciiCodePoint.OPEN_BRACKET:
        bracketCount += 1
        break
      case AsciiCodePoint.CLOSE_BRACKET:
        bracketCount -= 1
        break
    }
  }

  for (const token of internalTokens) {
    if (token.startIndex < startIndex) continue
    if (token.endIndex > endIndex) break
    for (; i < token.startIndex; ++i) {
      updateBracketCount()
      if (bracketCount < 0) return -1
    }
    i = token.endIndex
  }

  for (; i < endIndex; ++i) {
    updateBracketCount()
    if (bracketCount < 0) return -1
  }
  return bracketCount > 0 ? 1 : 0
}

/**
 * Checks whether the given half-open content range is valid link text. The
 * range represents content between the enclosing brackets and excludes those
 * brackets.
 *
 * A link text consists of a sequence of zero or more inline elements enclosed
 * by square brackets ('[' and ']'). The following rules apply:
 *
 * Links may not contain other links, at any level of nesting. If multiple
 * otherwise valid link definitions appear nested inside each other, the
 * inner-most definition is used.
 *
 * Brackets are allowed in the link text only if
 *
 *  (a) they are backslash-escaped or
 *  (b) they appear as a matched pair of brackets, with an open bracket '[', a
 *      sequence of zero or more inlines, and a close bracket ']'.
 *
 * Backtick code spans, autolinks, and raw HTML tags bind more tightly than the
 * brackets in link text. Thus, for example, '[foo`]`' could not be a link text,
 * since the second ']' is part of a code span.
 *
 * The brackets in link text bind more tightly than markers for emphasis and
 * strong emphasis. Thus, for example, '*[foo*](url)' is a link.
 *
 * @param nodePoints
 * @param startIndex Inclusive start of the link-text content.
 * @param endIndex Exclusive end of the link-text content.
 * @param internalTokens Inline tokens sorted by source position.
 * @see https://github.github.com/gfm/#link-text
 */
export function isValidLinkText(
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
  internalTokens: readonly IInlineToken[],
): boolean {
  if (startIndex < 0 || endIndex > nodePoints.length || startIndex > endIndex) return false

  for (const token of internalTokens) {
    if (token.startIndex >= endIndex) break
    if (token.endIndex <= startIndex) continue
    if (isLinkToken(token)) return false
  }

  return checkBalancedBracketsStatus(startIndex, endIndex, internalTokens, nodePoints) === 0
}
