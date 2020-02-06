import {
  CodePoint,
  InlineDataNodeType,
  DataNodeTokenPosition,
  DataNodeTokenPoint,
  DataNodeTokenFlankingAssemblyGraphEdge,
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

  public checkCandidatePartialMatches(
    content: string,
    codePoints: number[],
    points: DataNodeTokenPoint[],
    matches: DataNodeTokenFlankingAssemblyGraphEdge<T>,
    innerMatches?: DataNodeTokenFlankingAssemblyGraphEdge<T>[],
  ): boolean {
    if (!super.checkCandidatePartialMatches(content, codePoints, points, matches)) return false
    if (innerMatches == null || innerMatches.length <= 0) return true

    // 且左边界不得被包含，Image 的左边界厚度为 2
    if (innerMatches[0].from <= matches.from + 1) return false
    return true
  }

  /**
   * get all left borders (pattern: /!\[/)
   */
  protected matchLeftFlanking(): DataNodeTokenPosition[] {
    const self = this
    const { _currentCodePoints: codePoints } = self
    const results: DataNodeTokenPosition[] = []
    for (let offset = 0, column = 1, line = 1; offset < codePoints.length; ++offset, ++column) {
      const c = codePoints[offset]
      switch (c) {
        case CodePoint.BACK_SLASH:
          ++offset
          ++column
          break
        case CodePoint.LINE_FEED:
          column = 0
          ++line
          break
        case CodePoint.EXCLAMATION_MARK: {
          if (codePoints[offset + 1] !== CodePoint.OPEN_BRACKET) break
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
