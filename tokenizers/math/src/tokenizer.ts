import { MathType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcStringFromNodePoints,
  calcTrimBoundaryOfCodePoints,
} from '@yozora/character'
import type {
  IMatchBlockHook,
  IParseBlockHook,
  IPhrasingContentLine,
  IResultOfEatOpener,
  IResultOfParse,
  ITokenizer,
} from '@yozora/core-tokenizer'
import { TokenizerPriority, mergeContentLinesFaithfully } from '@yozora/core-tokenizer'
import FencedBlockTokenizer from '@yozora/tokenizer-fenced-block'
import type { INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for fenced math block.
 *
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
export class MathTokenizer
  extends FencedBlockTokenizer<T>
  implements ITokenizer, IMatchBlockHook<T, IToken>, IParseBlockHook<T, IToken, INode>
{
  public override readonly isContainingBlock = true

  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FENCED_BLOCK,
      nodeType: MathType,
      markers: [AsciiCodePoint.DOLLAR_SIGN],
      markersRequired: 2,
    })
  }

  /**
   * @override
   * @see IMatchBlockHook
   * @see FencedBlockTokenizer
   * @returns
   */
  public override eatOpener(line: Readonly<IPhrasingContentLine>): IResultOfEatOpener<T, IToken> {
    const result = super.eatOpener(line)
    if (result == null) return null

    // If there is no non-blank info string, it is a standard fenced math block.
    const { token } = result
    const [lft, rht] = calcTrimBoundaryOfCodePoints(token.infoString)
    if (lft >= rht) return result

    // Otherwise, it's a one-line math block.
    let i = rht - 1
    for (; i >= lft; --i) {
      const c = token.infoString[i].codePoint
      if (!this.markers.includes(c)) break
    }
    const countOfTailingMarker = rht - i - 1

    // Not a valid one-line math block
    if (countOfTailingMarker != token.markerCount) return null
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

  /**
   * @override
   * @see IParseBlockHook
   */
  public parseBlock(token: IToken): IResultOfParse<T, INode> {
    const contents: INodePoint[] = mergeContentLinesFaithfully(token.lines)

    /**
     * Backslash escape works in info strings in fenced code blocks.
     * @see https://github.github.com/gfm/#example-320
     */
    const node: INode = {
      type: MathType,
      value: calcStringFromNodePoints(contents),
    }
    return node
  }
}
