import type { NodeInterval, NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  isAsciiDigitCharacter,
  isAsciiLetter,
  isWhitespaceCharacter,
} from '@yozora/character'
import { eatOptionalWhitespaces } from '@yozora/core-tokenizer'

export type RawHTMLAttribute = {
  /**
   * Attribute name.
   */
  name: NodeInterval
  /**
   * Attribute value.
   */
  value?: NodeInterval
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
export function eatHTMLAttribute(
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
): { attribute: RawHTMLAttribute; nextIndex: number } | null {
  // eat whitespace.
  let i = eatOptionalWhitespaces(nodePoints, startIndex, endIndex)
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
  )
    return null
  for (i = attrNameStartIndex + 1; i < endIndex; ++i) {
    c = nodePoints[i].codePoint
    if (
      isAsciiLetter(c) ||
      isAsciiDigitCharacter(c) ||
      c === AsciiCodePoint.UNDERSCORE ||
      c === AsciiCodePoint.DOT ||
      c === AsciiCodePoint.COLON ||
      c === AsciiCodePoint.MINUS_SIGN
    )
      continue
    break
  }
  const attrNameEndIndex = i

  const attribute: RawHTMLAttribute = {
    name: {
      startIndex: attrNameStartIndex,
      endIndex: attrNameEndIndex,
    },
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
  i = eatOptionalWhitespaces(nodePoints, attrNameEndIndex, endIndex)
  if (i < endIndex && nodePoints[i].codePoint === AsciiCodePoint.EQUALS_SIGN) {
    i = eatOptionalWhitespaces(nodePoints, i + 1, endIndex)
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
              isWhitespaceCharacter(c) ||
              c === AsciiCodePoint.DOUBLE_QUOTE ||
              c === AsciiCodePoint.SINGLE_QUOTE ||
              c === AsciiCodePoint.EQUALS_SIGN ||
              c === AsciiCodePoint.OPEN_ANGLE ||
              c === AsciiCodePoint.CLOSE_ANGLE ||
              c === AsciiCodePoint.BACKTICK
            )
              break
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
