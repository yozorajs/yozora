import type { NodeInterval, NodePoint } from '@yozora/character'
import type { RawHTMLAttribute } from '@yozora/tokenizer-html-block'
import type { YastTokenDelimiter } from '@yozora/tokenizercore'
import { AsciiCodePoint } from '@yozora/character'
import { eatHTMLAttribute, eatHTMLTagName } from '@yozora/tokenizer-html-block'
import { eatOptionalWhitespaces } from '@yozora/tokenizercore'

export interface HtmlInlineOpenTagData {
  htmlType: 'open'
  /**
   * HTML tag name.
   */
  tagName: string
  /**
   * HTML attributes.
   */
  attributes: { name: string; value?: string }[]
  /**
   * Whether if a html tag is self closed.
   */
  selfClosed: boolean
}

export interface HtmlInlineOpenTokenData {
  htmlType: 'open'
  tagName: NodeInterval
  attributes: RawHTMLAttribute[]
  selfClosed: boolean
}

export interface HtmlInlineOpenDelimiter
  extends YastTokenDelimiter,
    HtmlInlineOpenTokenData {
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
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
): HtmlInlineOpenDelimiter | null {
  let i = startIndex
  if (i + 2 >= endIndex) return null

  const tagNameStartIndex = i + 1
  const tagNameEndIndex = eatHTMLTagName(
    nodePoints,
    tagNameStartIndex,
    endIndex,
  )
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

  if (i >= endIndex || nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE)
    return null

  const delimiter: HtmlInlineOpenDelimiter = {
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
