import { CodePoint, DataNodeTokenPointDetail } from '@yozora/tokenizer-core'
import { ImageDataNodeMatchState } from './tokenizer'


/**
 * override
 *
 * @see https://github.github.com/gfm/#link-text
 * @see https://github.github.com/gfm/#images
 * @return position at next iteration
 */
export function eatImageDescription(
  codePoints: DataNodeTokenPointDetail[],
  state: ImageDataNodeMatchState,
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
  // eslint-disable-next-line no-param-reassign
  state.leftFlanking = {
    start: obp.offset - 1,
    end: obp.offset + 1,
    thickness: 2,
  }
  // eslint-disable-next-line no-param-reassign
  state.middleFlanking = {
    start: cbp.offset,
    end: cbp.offset + 2,
    thickness: 2,
  }
  return state.middleFlanking.end
}
