import {
  CharCode,
  InlineDataNodeType,
  DataNodeTokenPosition,
  DataNodeTokenPoint,
} from '@yozora/core'
import { InlineDataNodeTokenizer } from '../types'
import { InlineLinkTokenizer } from './inline-link'


const T = InlineDataNodeType.IMAGE as unknown as InlineDataNodeType.INLINE_LINK
type T = typeof T


/**
 * Syntax for images is like the syntax for links, with one difference.
 * Instead of link text, we have an image description.
 * The rules for this are the same as for link text, except that
 *
 *  a) an image description starts with '![' rather than '[', and
 *  b) an image description may contain links.
 *
 * An image description has inline elements as its contents. When an image is rendered to HTML,
 * this is standardly used as the image’s alt attribute.
 *
 * @see https://github.github.com/gfm/#images
 */
export class ImageTokenizer
  extends InlineLinkTokenizer
  implements InlineDataNodeTokenizer<T> {
  public readonly type = T

  /**
   * get all left borders (pattern: /!\[/)
   * @param content
   */
  protected matchLeftFlanking(content: string): DataNodeTokenPosition[] {
    const results: DataNodeTokenPosition[] = []
    const idx = (x: number) => content.charCodeAt(x)
    for (let offset = 0, column = 1, line = 1; offset < content.length; ++offset, ++column) {
      const c = idx(offset)
      switch (c) {
        case CharCode.BACK_SLASH:
          ++offset
          ++column
          break
        case CharCode.LINE_FEED:
          column = 0
          ++line
          break
        case CharCode.EXCLAMATION_MARK: {
          if (idx(offset + 1) !== CharCode.OPEN_BRACKET) break
          const start: DataNodeTokenPoint = { offset, column, line }
          const end: DataNodeTokenPoint = { offset: offset + 2, column: column + 2, line }
          const result: DataNodeTokenPosition = { start, end }
          results.push(result)
          ++column, ++offset
          break
        }
      }
    }
    return results
  }
}
