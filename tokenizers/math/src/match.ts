import { calcTrimBoundaryOfCodePoints } from '@yozora/character'
import type {
  IBlockToken,
  IMatchBlockHook,
  IMatchBlockHookCreator,
  IPhrasingContentLine,
  IResultOfEatOpener,
} from '@yozora/core-tokenizer'
import { fencedBlockMatch } from '@yozora/tokenizer-fenced-block'
import type { IThis, IToken, T } from './types'

/**
 * * single line math block:
 *
 *   ```math
 *   $$x^2 + y^2=z^2$$
 *   ```
 *
 * * multiple line math block:
 *
 *  ```math
 *  $$
 *  f(x)=\left\lbrace\begin{aligned}
 *  &x^2, &x < 0\\
 *  &0, &x = 0\\
 *  &x^3, &x > 0
 *  \end{aligned}\right.
 *  $$
 *  ```
 *
 * @see https://github.com/remarkjs/remark-math
 */
export const match: IMatchBlockHookCreator<T, IToken, IThis> = function (api) {
  const { markers } = this
  const hook = fencedBlockMatch.call(this, api) as IMatchBlockHook<T, IToken>
  return {
    ...hook,
    isContainingBlock: true,
    eatOpener,
  }

  function eatOpener(
    line: Readonly<IPhrasingContentLine>,
    parentToken: Readonly<IBlockToken>,
  ): IResultOfEatOpener<T, IToken> {
    const result = hook.eatOpener(line, parentToken)
    if (result == null) return null

    // If there is no non-blank info string, it is a standard fenced math block.
    const { token } = result
    const [lft, rht] = calcTrimBoundaryOfCodePoints(token.infoString)
    if (lft >= rht) return result

    // Otherwise, it's a one-line math block.
    let i = rht - 1
    for (; i >= lft; --i) {
      const c = token.infoString[i].codePoint
      if (!markers.includes(c)) break
    }
    const countOfTailingMarker = rht - i - 1

    // Not a valid one-line math block
    if (countOfTailingMarker !== token.markerCount) return null
    const mathToken: IToken = {
      ...token,
      infoString: [],
      lines: [
        {
          nodePoints: token.infoString,
          startIndex: 0,
          endIndex: rht - countOfTailingMarker,
          firstNonWhitespaceIndex: lft,
          countOfPrecedeSpaces: 0,
        },
      ],
    }
    return { token: mathToken, nextIndex: line.endIndex, saturated: true }
  }
}
