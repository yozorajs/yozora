import { DataNodeTokenPointDetail } from '@yozora/tokenizer-core'
import { LinkDataNodeMatchState } from './tokenizer'


/**
 * A link text consists of a sequence of zero or more inline elements enclosed
 * by square brackets ('[' and ']'). The following rules apply:
 *  - Links may not contain other links, at any level of nesting.
 *    If multiple otherwise valid link definitions appear nested inside each other,
 *    the inner-most definition is used.
 *  - Brackets are allowed in the link text only if
 *    (a) they are backslash-escaped or
 *    (b) they appear as a matched pair of brackets, with an open bracket '[',
 *        a sequence of zero or more inlines, and a close bracket ']'.
 * @see https://github.github.com/gfm/#link-text
 * @return position at next iteration
 */
export function eatLinkText(
  codePoints: DataNodeTokenPointDetail[],
  state: LinkDataNodeMatchState,
  openBracketPoint: DataNodeTokenPointDetail,
  closeBracketPoint: DataNodeTokenPointDetail,
): number {
  /**
   * 将其置为左边界，即便此前已经存在左边界 (state.leftFlanking != null)；
   * 因为必然是先找到了中间边界，且尚未找到对应的右边界，说明之前的左边界和
   * 中间边界是无效的
   */
  const obp = openBracketPoint
  const cbp = closeBracketPoint
  // eslint-disable-next-line no-param-reassign
  state.leftFlanking = {
    start: obp.offset,
    end: obp.offset + 1,
    thickness: 1,
  }
  // eslint-disable-next-line no-param-reassign
  state.middleFlanking = {
    start: cbp.offset,
    end: cbp.offset + 2,
    thickness: 2,
  }
  return state.middleFlanking.end
}
