import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  EatingLineInfo,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  YastBlockNodeType,
} from '@yozora/tokenizercore-block'
import type {
  FencedCode as PS,
  FencedCodeMatchPhaseState as MS,
  FencedCodeMatchPhaseStateData as MSD,
  FencedCodeType as T,
} from './types'
import {
  AsciiCodePoint,
  isSpaceCharacter,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import { calcStringFromCodePoints } from '@yozora/tokenizercore'
import { eatOptionalWhiteSpaces } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  PhrasingContentType,
} from '@yozora/tokenizercore-block'
import { FencedCodeType } from './types'


/**
 * Lexical Analyzer for FencedCode
 *
 * A code fence is a sequence of at least three consecutive backtick characters
 * (`) or tildes (~). (Tildes and backticks cannot be mixed.) A fenced code block
 * begins with a code fence, indented no more than three spaces.
 * @see https://github.github.com/gfm/#code-fence
 */
export class FencedCodeTokenizer extends BaseBlockTokenizer<T> implements
  BlockTokenizer<T>,
  BlockTokenizerMatchPhaseHook<T, MSD>,
  BlockTokenizerParsePhaseHook<T, MSD, PS>
{
  public readonly name = 'FencedCodeTokenizer'
  public readonly uniqueTypes: T[] = [FencedCodeType]
  public readonly interruptableTypes: YastBlockNodeType[] = [PhrasingContentType]

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ): ResultOfEatOpener<T, MSD> {
    if (eatingInfo.isBlankLine) return null
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo
    let marker: number, count = 0, i = firstNonWhiteSpaceIndex
    for (; i < endIndex; ++i) {
      const c = nodePoints[i]

      /**
       * A code fence is a sequence of at least three consecutive backtick
       * characters (`) or tildes (~). (Tildes and backticks cannot be mixed.)
       * A fenced code block begins with a code fence, indented no more than
       * three spaces.
       */
      if (c.codePoint === AsciiCodePoint.BACKTICK || c.codePoint === AsciiCodePoint.TILDE) {
        if (count <= 0) {
          marker = c.codePoint
          count += 1
          continue
        }
        if (c.codePoint === marker!) {
          count += 1
          continue
        }
      }
      break
    }

    /**
     * Fewer than three backticks is not enough
     * @see https://github.github.com/gfm/#example-91
     */
    if (count < 3) return null

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
    const infoString: YastNodePoint[] = []
    for (; i < endIndex; ++i) {
      const c = nodePoints[i]
      /**
       * Info strings for backtick code blocks cannot contain backticks:
       * Info strings for tilde code blocks can contain backticks and tildes
       * @see https://github.github.com/gfm/#example-115
       * @see https://github.github.com/gfm/#example-116
       */
      if (c.codePoint === marker! && c.codePoint === AsciiCodePoint.BACKTICK) return null
      if (c.codePoint === AsciiCodePoint.LINE_FEED) break
      infoString.push(c)
    }

    const state: MS = {
      type: FencedCodeType,
      opening: true,
      saturated: false,
      parent: parentState,
      indent: firstNonWhiteSpaceIndex - startIndex,
      marker: marker!,
      markerCount: count,
      contents: [],
      infoString,
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public couldInterruptPreviousSibling(
    type: YastBlockNodeType,
    priority: number,
  ): boolean {
    if (this.priority < priority) return false
    return this.interruptableTypes.includes(type)
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public eatContinuationText(
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    state: MS,
  ): ResultOfEatContinuationText<T, MSD> {
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo

    /**
     * Check closing code fence
     *
     * The closing code fence may be indented up to three spaces, and may be
     * followed only by spaces, which are ignored. If the end of the containing
     * block (or document) is reached and no closing code fence has been found,
     * the code block contains all of the lines after the opening code fence until
     * the end of the containing block (or document). (An alternative spec would
     * require backtracking in the event that a closing code fence is not found.
     * But this makes parsing much less efficient, and there seems to be no real
     * down side to the behavior described here.)
     * @see https://github.github.com/gfm/#code-fence
     *
     * Closing fence indented with at most 3 spaces
     * @see https://github.github.com/gfm/#example-107
     */
    if (firstNonWhiteSpaceIndex - startIndex < 4 && firstNonWhiteSpaceIndex < endIndex) {
      let count = 0, i = firstNonWhiteSpaceIndex
      for (; i < endIndex; ++i) {
        const c = nodePoints[i]
        if (c.codePoint !== state.marker) break
        count += 1
      }
      /**
       * The closing code fence must be at least as long as the opening fence
       * @see https://github.github.com/gfm/#example-94
       */
      if (count >= state.markerCount) {
        /**
         * The closing code fence may be followed only by spaces.
         */
        for (; i < endIndex; ++i) {
          const c = nodePoints[i]
          if (!isSpaceCharacter(c.codePoint)) break
        }
        if (i + 1 >= endIndex) {
          // eslint-disable-next-line no-param-reassign
          state.saturated = true
          return { state, nextIndex: endIndex }
        }
      }
    }

    /**
     * Eating code content
     *
     * The content of the code block consists of all subsequent lines, until a
     * closing code fence of the same type as the code block began with (backticks
     * or tildes), and with at least as many backticks or tildes as the opening
     * code fence. If the leading code fence is indented N spaces, then up to N
     * spaces of indentation are removed from each line of the content (if present).
     * (If a content line is not indented, it is preserved unchanged. If it is
     * indented less than N spaces, all of the indentation is removed.)
     */
    for (let i = Math.min(startIndex + state.indent, firstNonWhiteSpaceIndex); i < endIndex; ++i) {
      const c = nodePoints[i]
      state.contents.push(c)
    }
    return { state, nextIndex: endIndex }
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parse(matchPhaseStateData: MSD): ResultOfParse<T, PS> {
    const infoString = matchPhaseStateData.infoString

    // match lang
    let i = eatOptionalWhiteSpaces(infoString, 0, infoString.length)
    const lang: YastNodePoint[] = []
    for (; i < infoString.length; ++i) {
      const p = infoString[i]
      if (isUnicodeWhiteSpaceCharacter(p.codePoint)) break
      lang.push(p)
    }

    // match meta
    i = eatOptionalWhiteSpaces(infoString, i, infoString.length)
    const meta: YastNodePoint[] = infoString.slice(i)

    const state: PS = {
      type: matchPhaseStateData.type,
      lang: calcStringFromCodePoints(lang),
      meta: calcStringFromCodePoints(meta),
      value: calcStringFromCodePoints(matchPhaseStateData.contents),
    }
    return { classification: 'flow', state }
  }
}
