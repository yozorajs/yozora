import { CodePoint, InlineDataNodeType } from '@yozora/core'
import { DataNodeTokenPointDetail } from '../../types/position'
import { DataNodeTokenizer} from '../../types/tokenizer'
import { InlineLinkTokenizer, InlineLinkMatchedResultItem, InlineLinkEatingState } from './inline-link'


type T = InlineDataNodeType.IMAGE | InlineDataNodeType.INLINE_LINK


export interface ImageEatingState extends InlineLinkEatingState {

}


/**
 * 匹配得到的结果
 */
export interface ImageMatchedResultItem extends InlineLinkMatchedResultItem {

}


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
export class ImageTokenizer extends InlineLinkTokenizer implements DataNodeTokenizer<T> {
  public readonly name = 'ImageTokenizer'
  protected readonly allowInnerLinks = true

  /**
   * override
   *
   * @see https://github.github.com/gfm/#link-text
   * @see https://github.github.com/gfm/#images
   * @return position at next iteration
   */
  protected eatLinkText(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    state: ImageEatingState,
    openBracketPoint: DataNodeTokenPointDetail,
    closeBracketPoint: DataNodeTokenPointDetail,
    firstSafeOffset: number,
  ): number {
    const obp = openBracketPoint
    if (obp.offset - 1 < firstSafeOffset) return -1
    if (codePoints[obp.offset - 1].codePoint !== CodePoint.EXCLAMATION_MARK) return -1

    let i = obp.offset - 2
    for (; i >= firstSafeOffset && codePoints[i].codePoint === CodePoint.BACK_SLASH;) i -= 1
    if ((obp.offset - i) & 1) return -1


    /**
     * 将其置为左边界，即便此前已经存在左边界 (state.leftFlanking != null)；
     * 因为必然是先找到了中间边界，且尚未找到对应的右边界，说明之前的左边界和
     * 中间边界是无效的
     */
    const cbp = closeBracketPoint
    state.leftFlanking = {
      start: obp.offset - 1,
      end: obp.offset + 1,
      thickness: 2,
    }
    state.middleFlanking = {
      start: cbp.offset,
      end: cbp.offset + 2,
      thickness: 2,
    }
    return state.middleFlanking.end
  }
}
