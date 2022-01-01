import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type { IYastTokenDelimiter } from '@yozora/core-tokenizer'

export interface IHtmlInlineCommentData {
  htmlType: 'comment'
}

export interface IHtmlInlineCommentTokenData {
  htmlType: 'comment'
}

export interface IHtmlInlineCommentDelimiter
  extends IYastTokenDelimiter,
    IHtmlInlineCommentTokenData {
  type: 'full'
}

/**
 * An HTML comment consists of `<!--` + text + `-->`, where text does not start
 * with `>` or `->`, does not end with `-`, and does not contain `--`.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#html-comment
 */
export function eatHtmlInlineCommentDelimiter(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): IHtmlInlineCommentDelimiter | null {
  let i = startIndex
  if (
    i + 6 >= endIndex ||
    nodePoints[i + 1].codePoint !== AsciiCodePoint.EXCLAMATION_MARK ||
    nodePoints[i + 2].codePoint !== AsciiCodePoint.MINUS_SIGN ||
    nodePoints[i + 3].codePoint !== AsciiCodePoint.MINUS_SIGN
  )
    return null

  // text dose not start with '>'
  if (nodePoints[i + 4].codePoint === AsciiCodePoint.CLOSE_ANGLE) return null

  // text dose not start with '->', and does not end with -
  if (
    nodePoints[i + 4].codePoint === AsciiCodePoint.MINUS_SIGN &&
    nodePoints[i + 5].codePoint === AsciiCodePoint.CLOSE_ANGLE
  )
    return null

  const si = i + 4
  for (i = si; i < endIndex; ++i) {
    const p = nodePoints[i]
    if (p.codePoint !== AsciiCodePoint.MINUS_SIGN) continue

    let hyphenCount = 1
    for (; i + hyphenCount < endIndex; hyphenCount += 1) {
      const q = nodePoints[i + hyphenCount]
      if (q.codePoint !== AsciiCodePoint.MINUS_SIGN) break
    }

    /**
     * Single hyphen is allowed.
     * @see https://github.github.com/gfm/#example-644
     */
    if (hyphenCount < 2) continue

    /**
     * text does not contain '--' and does not end with -
     * @see https://github.github.com/gfm/#example-645
     */
    if (
      hyphenCount > 2 ||
      i + 2 >= endIndex ||
      nodePoints[i + 2].codePoint !== AsciiCodePoint.CLOSE_ANGLE
    )
      return null

    const delimiter: IHtmlInlineCommentDelimiter = {
      type: 'full',
      startIndex,
      endIndex: i + 3,
      htmlType: 'comment',
    }
    return delimiter
  }
  return null
}
