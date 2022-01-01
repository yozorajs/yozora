import type { INodeInterval, INodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type { IYastTokenDelimiter } from '@yozora/core-tokenizer'
import { eatOptionalWhitespaces } from '@yozora/core-tokenizer'
import type { RawHTMLAttribute } from '@yozora/tokenizer-html-block'
import { eatHTMLAttribute, eatHTMLTagName } from '@yozora/tokenizer-html-block'

export interface IHtmlInlineOpenTagData {
  htmlType: 'open'
  /**
   * HTML tag name.
   */
  tagName: string
  /**
   * HTML attributes.
   */
  attributes: Array<{ name: string; value?: string }>
  /**
   * Whether if a html tag is self closed.
   */
  selfClosed: boolean
}

export interface IHtmlInlineOpenTokenData {
  htmlType: 'open'
  tagName: INodeInterval
  attributes: RawHTMLAttribute[]
  selfClosed: boolean
}

export interface IHtmlInlineOpenDelimiter extends IYastTokenDelimiter, IHtmlInlineOpenTokenData {
  type: 'full'
}

/**
 * An open tag consists of a '<' character, a tag name, zero or more attributes,
 * optional whitespace, an optional '/' character, and a '>' character.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#open-tag
 */
export function eatHtmlInlineTokenOpenDelimiter(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): IHtmlInlineOpenDelimiter | null {
  let i = startIndex
  if (i + 2 >= endIndex) return null

  const tagNameStartIndex = i + 1
  const tagNameEndIndex = eatHTMLTagName(nodePoints, tagNameStartIndex, endIndex)
  if (tagNameEndIndex == null) return null

  const attributes: RawHTMLAttribute[] = []
  for (i = tagNameEndIndex; i < endIndex; ) {
    const result = eatHTMLAttribute(nodePoints, i, endIndex)
    if (result == null) break
    attributes.push(result.attribute)
    i = result.nextIndex
  }

  i = eatOptionalWhitespaces(nodePoints, i, endIndex)
  if (i >= endIndex) return null

  let selfClosed = false
  if (nodePoints[i].codePoint === AsciiCodePoint.SLASH) {
    i += 1
    selfClosed = true
  }

  if (i >= endIndex || nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE) return null

  const delimiter: IHtmlInlineOpenDelimiter = {
    type: 'full',
    startIndex,
    endIndex: i + 1,
    htmlType: 'open',
    tagName: {
      startIndex: tagNameStartIndex,
      endIndex: tagNameEndIndex,
    },
    attributes,
    selfClosed,
  }
  return delimiter
}
