import { MathType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcStringFromNodePoints,
  calcTrimBoundaryOfCodePoints,
} from '@yozora/character'
import type {
  PhrasingContentLine,
  ResultOfEatOpener,
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
} from '@yozora/core-tokenizer'
import {
  TokenizerPriority,
  mergeContentLinesFaithfully,
} from '@yozora/core-tokenizer'
import FencedBlockTokenizer from '@yozora/tokenizer-fenced-block'
import type { Node, T, Token, TokenizerProps } from './types'
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
  implements
    Tokenizer,
    TokenizerMatchBlockHook<T, Token>,
    TokenizerParseBlockHook<T, Token, Node>
{
  public override readonly isContainingBlock = true

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
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
   * @see TokenizerMatchBlockHook
   * @see FencedBlockTokenizer
   * @returns
   */
  public override eatOpener(
    line: Readonly<PhrasingContentLine>,
  ): ResultOfEatOpener<T, Token> {
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
    const mathToken: Token = {
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
   * @see TokenizerParseBlockHook
   */
  public parseBlock(token: Token): ResultOfParse<T, Node> {
    const contents: NodePoint[] = mergeContentLinesFaithfully(token.lines)

    /**
     * Backslash escape works in info strings in fenced code blocks.
     * @see https://github.github.com/gfm/#example-320
     */
    const node: Node = {
      type: MathType,
      value: calcStringFromNodePoints(contents),
    }
    return node
  }
}
