import type { NodePoint } from '@yozora/character'
import type { YastNodeType } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  EatingLineInfo,
  PhrasingContentLine,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  FencedCode as Node,
  FencedCodeMatchPhaseState as MS,
  FencedCodePostMatchPhaseState as PMS,
  FencedCodeType as T,
} from './types'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  calcEscapedStringFromNodePoints,
  calcStringFromNodePoints,
  isSpaceCharacter,
  isUnicodeWhitespaceCharacter,
} from '@yozora/character'
import { eatOptionalWhitespaces } from '@yozora/tokenizercore'
import {
  PhrasingContentType,
  mergeContentLinesFaithfully,
} from '@yozora/tokenizercore-block'
import { FencedCodeType } from './types'


/**
 * Params for constructing FencedCodeTokenizer
 */
export interface FencedCodeTokenizerProps {
  /**
   * YastNode types that can be interrupt by this BlockTokenizer.
   */
  readonly interruptableTypes?: YastNodeType[]
}


/**
 * Lexical Analyzer for FencedCode
 *
 * A code fence is a sequence of at least three consecutive backtick characters
 * (`) or tildes (~). (Tildes and backticks cannot be mixed.) A fenced code
 * block begins with a code fence, indented no more than three spaces.
 * @see https://github.github.com/gfm/#code-fence
 */
export class FencedCodeTokenizer implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, Node>
{
  public readonly name: string = 'FencedCodeTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>
  public readonly recognizedTypes: ReadonlyArray<T> = [FencedCodeType]

  public constructor(props: FencedCodeTokenizerProps = {}) {
    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : [PhrasingContentType]
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: ReadonlyArray<NodePoint>,
    eatingInfo: EatingLineInfo,
  ): ResultOfEatOpener<T, MS> {
    /**
     * Four spaces indentation produces an indented code block
     * @see https://github.github.com/gfm/#example-104
     */
    if (eatingInfo.countOfPrecedeSpaces >= 4) return null

    const { startIndex, endIndex, firstNonWhitespaceIndex } = eatingInfo
    if (firstNonWhitespaceIndex >= endIndex) return null

    /**
     * A code fence is a sequence of at least three consecutive backtick
     * characters (`) or tildes (~). (Tildes and backticks cannot be mixed.)
     * A fenced code block begins with a code fence, indented no more than
     * three spaces.
     */
    const marker: number = nodePoints[firstNonWhitespaceIndex].codePoint
    if (
      marker !== AsciiCodePoint.BACKTICK &&
      marker !== AsciiCodePoint.TILDE
    ) return null

    let countOfMark = 1, i = firstNonWhitespaceIndex + 1
    for (; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      if (c !== marker) break
      countOfMark += 1
    }

    /**
     * Fewer than three backticks is not enough.
     * @see https://github.github.com/gfm/#example-91
     */
    if (countOfMark < 3) return null

    /**
     * Eating Information string
     * The line with the opening code fence may optionally contain some text
     * following the code fence; this is trimmed of leading and trailing
     * whitespace and called the info string. If the info string comes after
     * a backtick fence, it may not contain any backtick characters. (The
     * reason for this restriction is that otherwise some inline code would
     * be incorrectly interpreted as the beginning of a fenced code block.)
     * @see https://github.github.com/gfm/#info-string
     */
    const infoString: NodePoint[] = []
    for (; i < endIndex; ++i) {
      const p = nodePoints[i]
      /**
       * Info strings for backtick code blocks cannot contain backticks:
       * Info strings for tilde code blocks can contain backticks and tildes
       * @see https://github.github.com/gfm/#example-115
       * @see https://github.github.com/gfm/#example-116
       */
      if (
        marker === AsciiCodePoint.BACKTICK &&
        p.codePoint === marker
      ) return null

      if (p.codePoint === VirtualCodePoint.LINE_END) break
      infoString.push(p)
    }

    const state: MS = {
      type: FencedCodeType,
      indent: firstNonWhitespaceIndex - startIndex,
      marker: marker!,
      markerCount: countOfMark,
      lines: [],
      infoString,
    }
    return { state, nextIndex: endIndex }
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatContinuationText(
    nodePoints: ReadonlyArray<NodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
  ): ResultOfEatContinuationText {
    const {
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces,
    } = eatingInfo

    /**
     * Check closing code fence
     *
     * The closing code fence may be indented up to three spaces, and may be
     * followed only by spaces, which are ignored. If the end of the containing
     * block (or document) is reached and no closing code fence has been found,
     * the code block contains all of the lines after the opening code fence
     * until the end of the containing block (or document). (An alternative spec
     * would require backtracking in the event that a closing code fence is not
     * found. But this makes parsing much less efficient, and there seems to be
     * no real down side to the behavior described here.)
     * @see https://github.github.com/gfm/#code-fence
     *
     * Closing fence indented with at most 3 spaces
     * @see https://github.github.com/gfm/#example-107
     */
    if (
      countOfPrecedeSpaces < 4 &&
      firstNonWhitespaceIndex < endIndex
    ) {
      let markerCount = 0, i = firstNonWhitespaceIndex
      for (; i < endIndex; ++i) {
        const c = nodePoints[i].codePoint
        if (c !== state.marker) break
        markerCount += 1
      }

      /**
       * The closing code fence must be at least as long as the opening fence
       * @see https://github.github.com/gfm/#example-94
       */
      if (markerCount >= state.markerCount) {
        // The closing code fence may be followed only by spaces.
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
     * closing code fence of the same type as the code block began with
     * (backticks or tildes), and with at least as many backticks or tildes as
     * the opening code fence. If the leading code fence is indented N spaces,
     * then up to N spaces of indentation are removed from each line of the
     * content (if present).
     * (If a content line is not indented, it is preserved unchanged. If it is
     * indented less than N spaces, all of the indentation is removed.)
     */
    const firstIndex = Math.min(startIndex + state.indent, firstNonWhitespaceIndex)
    const line: PhrasingContentLine = {
      nodePoints,
      startIndex: firstIndex,
      endIndex,
      firstNonWhitespaceIndex,
    }
    state.lines.push(line)
    return { status: 'opening', nextIndex: endIndex }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(state: PMS): ResultOfParse<T, Node> {
    const infoString = state.infoString

    // match lang
    let i = eatOptionalWhitespaces(infoString, 0, infoString.length)
    const lang: NodePoint[] = []
    for (; i < infoString.length; ++i) {
      const p = infoString[i]
      if (isUnicodeWhitespaceCharacter(p.codePoint)) break
      lang.push(p)
    }

    // match meta
    i = eatOptionalWhitespaces(infoString, i, infoString.length)
    const meta: NodePoint[] = infoString.slice(i)

    const contents: NodePoint[] =
      mergeContentLinesFaithfully(state.lines)

    /**
     * Backslash escape works in info strings in fenced code blocks.
     * @see https://github.github.com/gfm/#example-320
     */
    const node: Node = {
      type: state.type,
      lang: calcEscapedStringFromNodePoints(lang, 0, lang.length, true),
      meta: calcEscapedStringFromNodePoints(meta, 0, meta.length, true),
      value: calcStringFromNodePoints(contents),
    }
    return { classification: 'flow', node }
  }
}
