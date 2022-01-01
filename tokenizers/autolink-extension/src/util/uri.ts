import type { INodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  isAlphanumeric,
  isPunctuationCharacter,
  isWhitespaceCharacter,
} from '@yozora/character'
import type { IResultOfOptionalEater, IResultOfRequiredEater } from '@yozora/core-tokenizer'
import { eatAutolinkSchema } from '@yozora/tokenizer-autolink'

/**
 * An extended url autolink will be recognised when one of the schemes 'http://',
 * or 'https://', followed by a valid domain, then zero or more non-space non-<
 * characters according to extended autolink path validation.
 *
 * @see https://github.github.com/gfm/#extended-url-autolink
 */
export function eatExtendedUrl(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): IResultOfRequiredEater {
  const schema = eatAutolinkSchema(nodePoints, startIndex, endIndex)
  const { nextIndex } = schema

  if (
    !schema.valid ||
    nextIndex + 3 >= endIndex ||
    nodePoints[nextIndex].codePoint !== AsciiCodePoint.COLON ||
    nodePoints[nextIndex + 1].codePoint !== AsciiCodePoint.SLASH ||
    nodePoints[nextIndex + 2].codePoint !== AsciiCodePoint.SLASH
  )
    return { valid: false, nextIndex: nextIndex + 1 }

  const result = eatValidDomain(nodePoints, nextIndex + 3, endIndex)
  result.nextIndex = eatOptionalDomainFollows(nodePoints, result.nextIndex, endIndex)
  return result
}

/**
 * An extended www autolink will be recognised when the text 'www.' is found
 * followed by a valid domain
 */
export function eatWWWDomain(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): IResultOfRequiredEater {
  const segment = eatDomainSegment(nodePoints, startIndex, endIndex)
  const nextIndex = segment.nextIndex

  if (
    !segment.valid ||
    nextIndex >= endIndex ||
    nodePoints[nextIndex].codePoint !== AsciiCodePoint.DOT ||
    nextIndex - startIndex !== 3
  )
    return { valid: false, nextIndex }

  for (let i = startIndex; i < nextIndex; ++i) {
    const c = nodePoints[i].codePoint
    if (c !== AsciiCodePoint.LOWERCASE_W && c !== AsciiCodePoint.UPPERCASE_W)
      return { valid: false, nextIndex }
  }

  const result = eatValidDomain(nodePoints, nextIndex + 1, endIndex)
  result.nextIndex = eatOptionalDomainFollows(nodePoints, result.nextIndex, endIndex)
  return result
}

/**
 * Try to eat an optional domain follows.
 *
 * After a valid domain, zero or more non-space non-'<' characters may follow.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#extended-autolink-path-validation
 */
export function eatOptionalDomainFollows(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): IResultOfOptionalEater {
  let nextIndex = startIndex
  for (; nextIndex < endIndex; ++nextIndex) {
    const c = nodePoints[nextIndex].codePoint
    if (isWhitespaceCharacter(c) || c === AsciiCodePoint.OPEN_ANGLE) break
  }

  // Trailing punctuation (specifically, '?', '!', '.', ',', ':', '*', '_', and '~')
  // will not be considered part of the autolink, though they may be included in
  // the interior of the link
  for (nextIndex -= 1; nextIndex >= startIndex; nextIndex -= 1) {
    const c = nodePoints[nextIndex].codePoint
    if (
      isPunctuationCharacter(c) ||
      c === AsciiCodePoint.QUESTION_MARK ||
      c === AsciiCodePoint.EXCLAMATION_MARK ||
      c === AsciiCodePoint.DOT ||
      c === AsciiCodePoint.COMMA ||
      c === AsciiCodePoint.COLON ||
      c === AsciiCodePoint.ASTERISK ||
      c === AsciiCodePoint.UNDERSCORE ||
      c === AsciiCodePoint.TILDE
    )
      continue
    break
  }

  /**
   * When an autolink ends in ')', we scan the entire autolink for the total
   * number of parentheses. If there is a greater number of closing parentheses
   * than opening ones, we don’t consider the unmatched trailing parentheses
   * part of the autolink, in order to facilitate including an autolink inside
   * a parenthesis.
   * @see https://github.github.com/gfm/#example-624
   * @see https://github.github.com/gfm/#example-625
   */
  if (
    nextIndex >= startIndex &&
    nextIndex + 1 < endIndex &&
    nodePoints[nextIndex + 1].codePoint === AsciiCodePoint.CLOSE_PARENTHESIS
  ) {
    let countOfOpenParenthesis = 0
    for (let i = startIndex; i < nextIndex; ++i) {
      const c = nodePoints[i].codePoint
      switch (c) {
        case AsciiCodePoint.OPEN_PARENTHESIS:
          countOfOpenParenthesis += 1
          break
        case AsciiCodePoint.CLOSE_PARENTHESIS:
          countOfOpenParenthesis -= 1
          break
      }
    }

    if (countOfOpenParenthesis > 0) {
      nextIndex += 2
      countOfOpenParenthesis -= 1
      for (; nextIndex < endIndex && countOfOpenParenthesis > 0; ) {
        const c = nodePoints[nextIndex].codePoint
        if (c !== AsciiCodePoint.CLOSE_PARENTHESIS) break
        countOfOpenParenthesis -= 1
        nextIndex += 1
      }
      nextIndex -= 1
    }
  }

  /**
   * If an autolink ends in a semicolon (;), we check to see if it appears to
   * resemble an entity reference; if the preceding text is & followed by one
   * or more alphanumeric characters. If so, it is excluded from the autolink.
   * @see https://github.github.com/gfm/#example-626
   */
  if (
    nextIndex + 1 < endIndex &&
    nodePoints[nextIndex + 1].codePoint === AsciiCodePoint.SEMICOLON
  ) {
    let i = nextIndex
    for (; i >= startIndex; --i) {
      const c = nodePoints[i].codePoint
      if (!isAlphanumeric(c)) break
    }
    if (i >= startIndex && nodePoints[i].codePoint === AsciiCodePoint.AMPERSAND) nextIndex = i - 1
  }

  return nextIndex + 1
}

/**
 * A valid domain consists of segments of alphanumeric characters,
 * underscores (_) and hyphens (-) separated by periods (.).
 *
 * @see https://github.github.com/gfm/#valid-domain
 */
export function eatValidDomain(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): IResultOfRequiredEater {
  const segment = eatDomainSegment(nodePoints, startIndex, endIndex)!
  if (!segment.valid || segment.nextIndex >= endIndex) {
    return { valid: false, nextIndex: segment.nextIndex }
  }

  let nextIndex = segment.nextIndex,
    countOfPeriod = 0
  let countOfUnderscoreOfLastTwoSegment = segment.hasUnderscore ? 2 : 0
  for (; nextIndex < endIndex; ) {
    if (nodePoints[nextIndex].codePoint !== AsciiCodePoint.DOT) break

    const segment = eatDomainSegment(nodePoints, nextIndex + 1, endIndex)
    if (!segment.valid) break

    nextIndex = segment.nextIndex
    countOfPeriod += 1
    countOfUnderscoreOfLastTwoSegment >>>= 1
    countOfUnderscoreOfLastTwoSegment |= segment.hasUnderscore ? 2 : 0
  }

  // There must be at least one period, and no underscores may be present in the
  // last two segments of the domain.
  if (countOfPeriod <= 0 && countOfUnderscoreOfLastTwoSegment === 0) {
    return { valid: false, nextIndex }
  }
  return { valid: true, nextIndex }
}

/**
 * A valid domain segment consists of alphanumeric characters,
 * underscores (_) and hyphens (-).
 * @see https://github.github.com/gfm/#valid-domain
 */
export function eatDomainSegment(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): IResultOfRequiredEater & { hasUnderscore: boolean } {
  let i = startIndex,
    hasUnderscore = false
  for (; i < endIndex; ++i) {
    const c = nodePoints[i].codePoint
    if (c === AsciiCodePoint.UNDERSCORE) {
      hasUnderscore = true
      continue
    }
    if (!isAlphanumeric(c) && c !== AsciiCodePoint.MINUS_SIGN) break
  }

  if (i > startIndex) return { valid: true, nextIndex: i, hasUnderscore }
  return { valid: false, nextIndex: i, hasUnderscore }
}
