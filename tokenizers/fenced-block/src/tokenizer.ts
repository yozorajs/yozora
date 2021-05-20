import type { YastNodeType } from '@yozora/ast'
import type { CodePoint, NodePoint } from '@yozora/character'
import {
  calcTrimBoundaryOfCodePoints,
  isSpaceCharacter,
} from '@yozora/character'
import type {
  PhrasingContentLine,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  Tokenizer,
  TokenizerMatchBlockHook,
  YastBlockToken,
} from '@yozora/core-tokenizer'
import {
  BaseTokenizer,
  TokenizerPriority,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
  eatOptionalCharacters,
} from '@yozora/core-tokenizer'
import type { FencedBlockType, Token, TokenizerProps } from './types'

/**
 * Lexical Matcher for FencedBlock.
 *
 * A block fence is a sequence of fence-marker characters (different marker
 * cannot be mixed.) A fenced block begins with a block fence, indented no more
 * than three spaces.
 *
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 */
export class FencedBlockTokenizer<T extends YastNodeType = FencedBlockType>
  extends BaseTokenizer
  implements Tokenizer, TokenizerMatchBlockHook<T, Token<T>>
{
  public readonly isContainingBlock: boolean = false

  protected readonly nodeType: T
  protected readonly markers: CodePoint[] = []
  protected readonly markersRequired: number
  protected readonly checkInfoString: TokenizerProps<T>['checkInfoString']

  /* istanbul ignore next */
  constructor(props: TokenizerProps<T>) {
    super({
      name: props.name,
      priority: props.priority ?? TokenizerPriority.FENCED_BLOCK,
    })
    this.nodeType = props.nodeType
    this.markers = props.markers
    this.markersRequired = props.markersRequired
    this.checkInfoString = props.checkInfoString
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatOpener(
    line: Readonly<PhrasingContentLine>,
  ): ResultOfEatOpener<T, Token<T>> {
    /**
     * Four spaces indentation produces an indented code block
     * @see https://github.github.com/gfm/#example-104
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex >= endIndex) return null

    const marker: number = nodePoints[firstNonWhitespaceIndex].codePoint
    if (this.markers.indexOf(marker) < 0) return null

    const i = eatOptionalCharacters(
      nodePoints,
      firstNonWhitespaceIndex + 1,
      endIndex,
      marker,
    )
    const countOfMark = i - firstNonWhitespaceIndex

    /**
     * The number of marker is not enough.
     * @see https://github.github.com/gfm/#example-91
     */
    if (countOfMark < this.markersRequired) return null

    /**
     * Eating Information string
     * The line with the opening block fence may optionally contain some text
     * following the block fence; this is trimmed of leading and trailing
     * whitespace and called the info string. If the info string comes after
     * a backtick fence, it may not contain any backtick characters. (The
     * reason for this restriction is that otherwise some inline code would
     * be incorrectly interpreted as the beginning of a fenced code block.)
     * @see https://github.github.com/gfm/#info-string
     */
    const [iLft, iRht] = calcTrimBoundaryOfCodePoints(nodePoints, i, endIndex)
    const infoString: NodePoint[] = nodePoints.slice(iLft, iRht)

    /**
     * Check if info string is valid, such as info strings for backtick code
     * blocks cannot contain backticks.
     * @see https://github.github.com/gfm/#example-115
     * @see https://github.github.com/gfm/#example-116
     */
    if (
      this.checkInfoString != null &&
      !this.checkInfoString(infoString, marker, countOfMark)
    ) {
      return null
    }

    const nextIndex = endIndex
    const token: Token<T> = {
      nodeType: this.nodeType,
      position: {
        start: calcStartYastNodePoint(nodePoints, startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex - 1),
      },
      indent: firstNonWhitespaceIndex - startIndex,
      marker: marker!,
      markerCount: countOfMark,
      lines: [],
      infoString,
    }
    return { token, nextIndex }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatAndInterruptPreviousSibling(
    line: Readonly<PhrasingContentLine>,
    prevSiblingToken: Readonly<YastBlockToken>,
  ): ResultOfEatAndInterruptPreviousSibling<T, Token<T>> {
    const result = this.eatOpener(line)
    if (result == null) return null
    return {
      token: result.token,
      nextIndex: result.nextIndex,
      remainingSibling: prevSiblingToken,
    }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatContinuationText(
    line: Readonly<PhrasingContentLine>,
    token: Token<T>,
  ): ResultOfEatContinuationText {
    const {
      nodePoints,
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces,
    } = line

    /**
     * Check closing block fence
     *
     * The closing block fence may be indented up to three spaces, and may be
     * followed only by spaces, which are ignored. If the end of the containing
     * block (or document) is reached and no closing block fence has been found,
     * the code block contains all of the lines after the opening block fence
     * until the end of the containing block (or document). (An alternative spec
     * would require backtracking in the event that a closing block fence is not
     * found. But this makes parsing much less efficient, and there seems to be
     * no real down side to the behavior described here.)
     * @see https://github.github.com/gfm/#code-fence
     *
     * Closing fence indented with at most 3 spaces
     * @see https://github.github.com/gfm/#example-107
     */
    if (countOfPrecedeSpaces < 4 && firstNonWhitespaceIndex < endIndex) {
      let i = eatOptionalCharacters(
        nodePoints,
        firstNonWhitespaceIndex,
        endIndex,
        token.marker,
      )
      const markerCount = i - firstNonWhitespaceIndex

      /**
       * The closing block fence must be at least as long as the opening fence
       * @see https://github.github.com/gfm/#example-94
       */
      if (markerCount >= token.markerCount) {
        // The closing block fence may be followed only by spaces.
        for (; i < endIndex; ++i) {
          const c = nodePoints[i].codePoint
          if (!isSpaceCharacter(c)) break
        }

        if (i + 1 >= endIndex) {
          return { status: 'closing', nextIndex: endIndex }
        }
      }
    }

    /**
     * Eating code content
     *
     * The content of the code block consists of all subsequent lines, until a
     * closing block fence of the same type as the code block began with
     * (backticks or tildes), and with at least as many backticks or tildes as
     * the opening block fence. If the leading block fence is indented N spaces,
     * then up to N spaces of indentation are removed from each line of the
     * content (if present).
     *
     * If a content line is not indented, it is preserved unchanged. If it is
     * indented less than N spaces, all of the indentation is removed, but the
     * line feed should be preserve.
     */
    const firstIndex = Math.min(
      startIndex + token.indent,
      firstNonWhitespaceIndex,
      endIndex - 1,
    )
    token.lines.push({
      nodePoints,
      startIndex: firstIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces,
    })
    return { status: 'opening', nextIndex: endIndex }
  }
}
