import {
  BaseBlockDataNodeTokenizer,
  BlockDataNodeEatingLineInfo,
  BlockDataNodeEatingResult,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
  BlockDataNodeTokenizer,
  CodePoint,
  DataNodeTokenPointDetail,
  calcStringFromCodePoints,
  calcTrimBoundaryOfCodePoints,
  isUnicodeWhiteSpace,
} from '@yozora/tokenizer-core'
import {
  FencedCodeDataNode,
  FencedCodeDataNodeData,
  FencedCodeDataNodeType,
} from './types'


type T = FencedCodeDataNodeType


export interface FencedCodeDataNodeMatchState extends BlockDataNodeMatchState<T> {
  indent: number
  marker: number
  markerCount: number
  codePoints: DataNodeTokenPointDetail[]
  infoString: DataNodeTokenPointDetail[]
}


export interface FencedCodeDataNodeMatchResult extends BlockDataNodeMatchResult<T> {
  indent: number
  codePoints: DataNodeTokenPointDetail[]
  infoString: DataNodeTokenPointDetail[]
}


/**
 * Lexical Analyzer for FencedCodeDataNode
 *
 * A code fence is a sequence of at least three consecutive backtick characters
 * (`) or tildes (~). (Tildes and backticks cannot be mixed.) A fenced code block
 * begins with a code fence, indented no more than three spaces.
 * @see https://github.github.com/gfm/#code-fence
 */
export class FencedCodeTokenizer extends BaseBlockDataNodeTokenizer<
  T,
  FencedCodeDataNodeData,
  FencedCodeDataNodeMatchState,
  FencedCodeDataNodeMatchResult>
  implements BlockDataNodeTokenizer<
  T,
  FencedCodeDataNodeData,
  FencedCodeDataNodeMatchState,
  FencedCodeDataNodeMatchResult> {
  public readonly name = 'FencedCodeTokenizer'
  public readonly recognizedTypes: T[] = [FencedCodeDataNodeType]

  /**
   * override
   */
  public eatNewMarker(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    parentState: BlockDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, FencedCodeDataNodeMatchState> | null {
    if (eatingLineInfo.isBlankLine) return null
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingLineInfo
    let marker: number, count = 0, i = firstNonWhiteSpaceIndex
    for (; i < endIndex; ++i) {
      const c = codePoints[i]
      if (c.codePoint === CodePoint.BACKTICK || c.codePoint === CodePoint.TILDE) {
        if (count <= 0) {
          marker = c.codePoint
          ++count
          continue
        }
        if (c.codePoint === marker!) {
          ++count
          continue
        }
      }
      break
    }

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
      const c = codePoints[i]
      /**
       * Info strings for tilde code blocks can contain backticks and tildes
       * @see https://github.github.com/gfm/#example-116
       */
      if (c.codePoint === marker! && c.codePoint === CodePoint.BACKTICK) return null
      if (c.codePoint === CodePoint.LINE_FEED) break
      infoString.push(c)
    }

    const state: FencedCodeDataNodeMatchState = {
      type: FencedCodeDataNodeType,
      opening: true,
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
   * override
   */
  public eatContinuationText(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    state: FencedCodeDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, FencedCodeDataNodeMatchState> | null {
    const { startIndex, firstNonWhiteSpaceIndex, endIndex } = eatingLineInfo

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
     */
    if (firstNonWhiteSpaceIndex < endIndex) {
      let count = 0, i = firstNonWhiteSpaceIndex
      for (; i < endIndex; ++i) {
        const c = codePoints[i]
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
          const c = codePoints[i]
          if (!isUnicodeWhiteSpace(c.codePoint)) break
        }
        if (i >= endIndex) {
          this.beforeCloseMatchState(state)
          return { nextIndex: endIndex, state }
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
      const c = codePoints[i]
      state.codePoints.push(c)
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * override
   */
  public match(state: FencedCodeDataNodeMatchState): FencedCodeDataNodeMatchResult {
    const result: FencedCodeDataNodeMatchResult = {
      type: state.type,
      indent: state.indent,
      codePoints: state.codePoints,
      infoString: state.infoString,
    }
    return result
  }

  /**
   * override
   */
  public parse(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: FencedCodeDataNodeMatchResult,
  ): FencedCodeDataNode {
    let langEndIndex = 0
    for (; langEndIndex < matchResult.infoString.length; ++langEndIndex) {
      const c = matchResult.infoString[langEndIndex]
      if (isUnicodeWhiteSpace(c.codePoint)) break
    }
    let metaStartIndex = langEndIndex + 1
    for (; metaStartIndex < matchResult.infoString.length; ++metaStartIndex) {
      const c = matchResult.infoString[metaStartIndex]
      if (!isUnicodeWhiteSpace(c.codePoint)) break
    }

    const lang = calcStringFromCodePoints(matchResult.infoString.slice(0, langEndIndex))
    const meta = calcStringFromCodePoints(matchResult.infoString.slice(metaStartIndex))
    const result: FencedCodeDataNode = {
      type: matchResult.type,
      data: {
        lang,
        meta,
        value: calcStringFromCodePoints(matchResult.codePoints),
      }
    }
    return result
  }

  /**
   * override
   */
  public beforeCloseMatchState(state: FencedCodeDataNodeMatchState): void {
    // eslint-disable-next-line no-param-reassign
    state.opening = false

    // do trim
    const [leftIndex, rightIndex] = calcTrimBoundaryOfCodePoints(state.infoString)
    if (rightIndex - leftIndex < state.infoString.length) {
      // eslint-disable-next-line no-param-reassign
      state.infoString = state.infoString.slice(leftIndex, rightIndex)
    }
  }
}
