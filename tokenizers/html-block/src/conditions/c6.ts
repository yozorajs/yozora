import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'


const includedTags = [
  'address', 'article', 'aside', 'base', 'basefont', 'blockquote', 'body',
  'caption', 'center', 'col', 'colgroup', 'dd', 'details', 'dialog', 'dir',
  'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header',
  'hr', 'html', 'iframe', 'legend', 'li', 'link', 'main', 'menu', 'menuitem',
  'nav', 'noframes', 'ol', 'optgroup', 'option', 'p', 'param', 'section',
  'source', 'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'title',
  'tr', 'track', 'ul'
]


/**
 * Eat block html start condition 6:
 *
 *    line begins the string `<` or `</` followed by one of
 *    the strings (case-insensitive) `address`, `article`, `aside`, `base`,
 *    `basefont`, `blockquote`, `body`, `caption`, `center`, `col`, `colgroup`,
 *    `dd`, `details`, `dialog`, `dir`, `div`, `dl`, `dt`, `fieldset`,
 *    `figcaption`, `figure`, `footer`, `form`, `frame`, `frameset`, `h1`,
 *    `h2`, `h3`, `h4`, `h5`, `h6`, `head`, `header`, `hr`, `html`, `iframe`,
 *    `legend`, `li`, `link`, `main`, `menu`, `menuitem`, `nav`, `noframes`,
 *    `ol`, `optgroup`, `option`, `p`, `param`, `section`, `source`, `summary`,
 *    `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `title`, `tr`, `track`,
 *    `ul`, followed by whitespace, the end of the line, the string `>`,
 *    or the string `/>`.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#start-condition
 */
export function eatStartCondition6(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
  tagName: string,
): number | null {
  if (!includedTags.includes(tagName)) return null
  if (startIndex >= endIndex) return endIndex

  const c = nodePoints[startIndex].codePoint
  if (
    isWhiteSpaceCharacter(c) ||
    c === AsciiCodePoint.CLOSE_ANGLE
  ) return startIndex + 1

  if (
    c === AsciiCodePoint.SLASH &&
    startIndex + 1 < endIndex &&
    nodePoints[startIndex + 1].codePoint === AsciiCodePoint.CLOSE_ANGLE
  ) return startIndex + 2

  return null
}
