import {
  eatOptionalWhiteSpaces,
  EnhancedYastNodePoint,
  YastNodeInterval,
} from '@yozora/tokenizercore'
import type { InlineTokenDelimiter } from '@yozora/tokenizercore-inline'
import type { InlineHtml } from '../types'
import { AsciiCodePoint, isAsciiDigit, isAsciiLetter, isWhiteSpaceCharacter } from '@yozora/character'


export const InlineHtmlOpenTagType = 'open'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type InlineHtmlOpenTagType = typeof InlineHtmlOpenTagType


type RawInlineHtmlAttribute = {
  name: YastNodeInterval,
  value?: YastNodeInterval
}


/**
 * @see https://github.github.com/gfm/#open-tag
 */
export interface InlineHtmlOpenTag extends InlineHtml {
  tagType: InlineHtmlOpenTagType
  /**
   * HTML tag name.
   */
  tagName: string
  /**
   * HTML attributes.
   */
  attributes: { name: string, value?: string }[]
  /**
   * Whether if a html tag is self closed.
   */
  selfClosed: boolean
}


export interface InlineHtmlOpenMatchPhaseData {
  tagType: InlineHtmlOpenTagType
  tagName: YastNodeInterval
  attributes: RawInlineHtmlAttribute[]
  selfClosed: boolean
}


export interface InlineHtmlOpenDelimiter extends InlineTokenDelimiter {
  type: InlineHtmlOpenTagType
  tagName: YastNodeInterval
  attributes: { name: YastNodeInterval, value?: YastNodeInterval }[]
  selfClosed: boolean
}


/**
 * Try to eating a HTML open tag delimiter.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#open-tag
 */
export function eatInlineHtmlTokenOpenDelimiter(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): InlineHtmlOpenDelimiter | null {
  let i = startIndex
  if (i + 2 >= endIndex) return null

  const tagNameStartIndex = i + 1
  const tagNameEndIndex = eatHtmlTagName(nodePoints, tagNameStartIndex, endIndex)
  if (tagNameEndIndex == null) return null

  const attributes: RawInlineHtmlAttribute[] = []
  for (i = tagNameEndIndex; i < endIndex;) {
    const result = eatAttribute(nodePoints, i, endIndex)
    if (result == null) break
    attributes.push(result.attribute)
    i = result.nextIndex
  }

  i = eatOptionalWhiteSpaces(nodePoints, i, endIndex)
  if (i >= endIndex) return null

  let selfClosed = false
  if (nodePoints[i].codePoint === AsciiCodePoint.FORWARD_SLASH) {
    i += 1
    selfClosed = true
  }

  if (
    i >= endIndex ||
    nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE
  ) return null

  const delimiter: InlineHtmlOpenDelimiter = {
    type: InlineHtmlOpenTagType,
    startIndex,
    endIndex: i + 1,
    tagName: {
      startIndex: tagNameStartIndex,
      endIndex: tagNameEndIndex,
    },
    attributes,
    selfClosed
  }
  return delimiter
}


/**
 * A tag name consists of an ASCII letter followed by zero or more ASCII
 * letters, digits, or hyphens (-).
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#tag-name
 */
export function eatHtmlTagName(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): number | null {
  if (
    startIndex >= endIndex ||
    !isAsciiLetter(nodePoints[startIndex].codePoint)
  ) return null

  let i = startIndex
  for (; i < endIndex; ++i) {
    const c = nodePoints[i].codePoint
    if (
      isAsciiLetter(c) ||
      isAsciiDigit(c) ||
      c === AsciiCodePoint.MINUS_SIGN
    ) continue
    return i
  }
  return i
}


/**
 * An attribute consists of whitespace, an attribute name, and an optional
 * attribute value specification.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#attribute
 */
export function eatAttribute(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): { attribute: RawInlineHtmlAttribute, nextIndex: number } | null {
  // eat whitespace.
  let i = eatOptionalWhiteSpaces(nodePoints, startIndex, endIndex)
  if (i <= startIndex || i >= endIndex) return null

  /**
   * Eat attribute name.
   *
   * An attribute name consists of an ASCII letter, `_`, or `:`, followed by
   * zero or more ASCII letters, digits, `_`, `.`, `:`, or `-`.
   * @see https://github.github.com/gfm/#attribute-name
   */
  const attrNameStartIndex = i
  let c = nodePoints[i].codePoint
  if (
    !isAsciiLetter(c) &&
    c !== AsciiCodePoint.UNDERSCORE &&
    c !== AsciiCodePoint.COLON
  ) return null
  for (i = attrNameStartIndex + 1; i < endIndex; ++i) {
    c = nodePoints[i].codePoint
    if (
      isAsciiLetter(c) ||
      isAsciiDigit(c) ||
      c === AsciiCodePoint.UNDERSCORE ||
      c === AsciiCodePoint.DOT ||
      c === AsciiCodePoint.COLON ||
      c === AsciiCodePoint.MINUS_SIGN
    ) continue
    break
  }
  const attrNameEndIndex = i

  const attribute: RawInlineHtmlAttribute = {
    name: {
      startIndex: attrNameStartIndex,
      endIndex: attrNameEndIndex,
    }
  }

  /**
   * Eat attribute value.
   *
   * An attribute value specification consists of optional whitespace, a `=`
   * character, optional whitespace, and an attribute value.
   *
   * An attribute value consists of an unquoted attribute value, a single-quoted
   * attribute value, or a double-quoted attribute value.
   *
   * @see https://github.github.com/gfm/#attribute-value-specification
   * @see https://github.github.com/gfm/#attribute-value
   */
  i = eatOptionalWhiteSpaces(nodePoints, attrNameEndIndex, endIndex)
  if (i < endIndex && nodePoints[i].codePoint === AsciiCodePoint.EQUALS_SIGN) {
    i = eatOptionalWhiteSpaces(nodePoints, i + 1, endIndex)
    if (i < endIndex) {
      const mark = nodePoints[i].codePoint
      switch (mark) {
        /**
         * A double-quoted attribute value consists of `"`, zero or more
         * characters not including `"`, and a final `"`.
         * @see https://github.github.com/gfm/#double-quoted-attribute-value
         */
        case AsciiCodePoint.DOUBLE_QUOTE: {
          const attrValueStartIndex = i + 1
          for (i = attrValueStartIndex; i < endIndex; ++i) {
            c = nodePoints[i].codePoint
            if (c === AsciiCodePoint.DOUBLE_QUOTE) break
          }
          const attrValueEndIndex = i
          if (
            i < endIndex &&
            nodePoints[i].codePoint === AsciiCodePoint.DOUBLE_QUOTE
          ) {
            attribute.value = {
              startIndex: attrValueStartIndex,
              endIndex: attrValueEndIndex,
            }
            i += 1
          }
          break
        }
        /**
         * A single-quoted attribute value consists of `'`, zero or more
         * characters not including `'`, and a final `'`.
         * @see https://github.github.com/gfm/#single-quoted-attribute-value
         */
        case AsciiCodePoint.SINGLE_QUOTE: {
          const attrValueStartIndex = i + 1
          for (i = attrValueStartIndex; i < endIndex; ++i) {
            c = nodePoints[i].codePoint
            if (c === AsciiCodePoint.SINGLE_QUOTE) break
          }
          const attrValueEndIndex = i
          if (
            i < endIndex &&
            nodePoints[i].codePoint === AsciiCodePoint.SINGLE_QUOTE
          ) {
            attribute.value = {
              startIndex: attrValueStartIndex,
              endIndex: attrValueEndIndex,
            }
            i += 1
          }
          break
        }
        /**
         * An unquoted attribute value is a nonempty string of characters not
         * including whitespace, `"`, `'`, `=`, `<`, `>`, or `\``.
         * @see https://github.github.com/gfm/#unquoted-attribute-value
         */
        default: {
          const attrValueStartIndex = i
          for (; i < endIndex; ++i) {
            c = nodePoints[i].codePoint
            if (
              isWhiteSpaceCharacter(c) ||
              c === AsciiCodePoint.DOUBLE_QUOTE ||
              c === AsciiCodePoint.SINGLE_QUOTE ||
              c === AsciiCodePoint.EQUALS_SIGN ||
              c === AsciiCodePoint.OPEN_ANGLE ||
              c === AsciiCodePoint.CLOSE_ANGLE ||
              c === AsciiCodePoint.BACKTICK
            ) break
          }
          const attrValueEndIndex = i
          if (attrValueEndIndex > attrValueStartIndex) {
            attribute.value = {
              startIndex: attrValueStartIndex,
              endIndex: attrValueEndIndex,
            }
          }
          break
        }
      }

      if (attribute.value != null) {
        return { attribute, nextIndex: i }
      }
    }
  }

  return { attribute, nextIndex: attrNameEndIndex }
}
