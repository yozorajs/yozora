import type { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  EatAndInterruptPreviousSiblingResult,
  EatContinuationTextResult,
  EatNewMarkerResult,
  EatingLineInfo,
} from '@yozora/tokenizercore-block'
import type {
  FencedCodeDataNode,
  FencedCodeMatchPhaseState,
  FencedCodePreMatchPhaseState,
} from './types'
import {
  AsciiCodePoint,
  isSpaceCharacter,
  isWhiteSpaceCharacter,
} from '@yozora/character'
import { ParagraphDataNodeType } from '@yozora/tokenizer-paragraph'
import {
  calcStringFromCodePoints,
  calcTrimBoundaryOfCodePoints,
} from '@yozora/tokenizercore'
import { BaseBlockTokenizer } from '@yozora/tokenizercore-block'
import { FencedCodeDataNodeType } from './types'


type T = FencedCodeDataNodeType


/**
 * Lexical Analyzer for FencedCodeDataNode
 *
 * A code fence is a sequence of at least three consecutive backtick characters
 * (`) or tildes (~). (Tildes and backticks cannot be mixed.) A fenced code block
 * begins with a code fence, indented no more than three spaces.
 * @see https://github.github.com/gfm/#code-fence
 */
export class FencedCodeTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPreMatchPhaseHook<
      T,
      FencedCodePreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<
      T,
      FencedCodePreMatchPhaseState,
      FencedCodeMatchPhaseState>,
    BlockTokenizerParsePhaseHook<
      T,
      FencedCodeMatchPhaseState,
      FencedCodeDataNode>
{
  public readonly name = 'FencedCodeTokenizer'
  public readonly uniqueTypes: T[] = [FencedCodeDataNodeType]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): EatNewMarkerResult<T, FencedCodePreMatchPhaseState> {
    if (eatingInfo.isBlankLine) return null
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingInfo
    let marker: number, count = 0, i = firstNonWhiteSpaceIndex
    for (; i < endIndex; ++i) {
      const c = codePositions[i]

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
    const infoString: DataNodeTokenPointDetail[] = []
    for (; i < endIndex; ++i) {
      const c = codePositions[i]
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

    const state: FencedCodePreMatchPhaseState = {
      type: FencedCodeDataNodeType,
      opening: true,
      saturated: false,
      parent: parentState,
      indent: firstNonWhiteSpaceIndex - startIndex,
      marker: marker!,
      markerCount: count,
      codePoints: [],
      infoString,
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatAndInterruptPreviousSibling(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
    previousSiblingState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): EatAndInterruptPreviousSiblingResult<T, FencedCodePreMatchPhaseState> {
    const self = this
    switch (previousSiblingState.type) {
      /**
       * Fenced code blocks can interrupt paragraphs, and can be followed
       * directly by paragraphs, without a blank line between
       * @see https://github.github.com/gfm/#example-110
       * @see https://github.github.com/gfm/#example-111
       */
      case ParagraphDataNodeType: {
        const eatingResult = self.eatNewMarker(codePositions, eatingInfo, parentState)
        if (eatingResult == null) return null
        return { ...eatingResult, shouldRemovePreviousSibling: false }
      }
      default:
        return null
    }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: EatingLineInfo,
    state: FencedCodePreMatchPhaseState,
  ): EatContinuationTextResult<T, FencedCodePreMatchPhaseState> {
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
        const c = codePositions[i]
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
          const c = codePositions[i]
          if (!isSpaceCharacter(c.codePoint)) break
        }
        if (i + 1 >= endIndex) {
          // eslint-disable-next-line no-param-reassign
          state.saturated = true
          return { resultType: 'continue', state, nextIndex: endIndex}
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
      const c = codePositions[i]
      state.codePoints.push(c)
    }
    return { resultType: 'continue', state, nextIndex: endIndex }
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: FencedCodePreMatchPhaseState
  ): FencedCodeMatchPhaseState {
    // Do trim
    let infoString = preMatchPhaseState.infoString
    const [leftIndex, rightIndex] = calcTrimBoundaryOfCodePoints(infoString)
    if (rightIndex - leftIndex < infoString.length) {
      infoString = infoString.slice(leftIndex, rightIndex)
    }

    const result: FencedCodeMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      indent: preMatchPhaseState.indent,
      codePoints: preMatchPhaseState.codePoints,
      infoString,
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: FencedCodeMatchPhaseState,
  ): FencedCodeDataNode {
    let langEndIndex = 0
    for (; langEndIndex < matchPhaseState.infoString.length; ++langEndIndex) {
      const c = matchPhaseState.infoString[langEndIndex]
      if (isWhiteSpaceCharacter(c.codePoint)) break
    }
    let metaStartIndex = langEndIndex + 1
    for (; metaStartIndex < matchPhaseState.infoString.length; ++metaStartIndex) {
      const c = matchPhaseState.infoString[metaStartIndex]
      if (!isWhiteSpaceCharacter(c.codePoint)) break
    }

    const lang = calcStringFromCodePoints(matchPhaseState.infoString.slice(0, langEndIndex))
    const meta = calcStringFromCodePoints(matchPhaseState.infoString.slice(metaStartIndex))
    const result: FencedCodeDataNode = {
      type: matchPhaseState.type,
      lang,
      meta,
      value: calcStringFromCodePoints(matchPhaseState.codePoints),
    }
    return result
  }
}
