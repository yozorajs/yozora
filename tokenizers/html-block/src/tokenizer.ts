import type { NodeInterval, NodePoint } from '@yozora/character'
import type { YastNodeType } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  EatingLineInfo,
  PhrasingContentLine,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  HtmlBlock as PS,
  HtmlBlockConditionType,
  HtmlBlockMatchPhaseState as MS,
  HtmlBlockPostMatchPhaseState as PMS,
  HtmlBlockType as T,
} from './types'
import { AsciiCodePoint, calcStringFromNodePoints } from '@yozora/character'
import { eatOptionalWhitespaces } from '@yozora/tokenizercore'
import {
  PhrasingContentType,
  mergeContentLinesFaithfully,
} from '@yozora/tokenizercore-block'
import { eatEndCondition1, eatStartCondition1 } from './conditions/c1'
import { eatEndCondition2, eatStartCondition2 } from './conditions/c2'
import { eatEndCondition3, eatStartCondition3 } from './conditions/c3'
import { eatEndCondition4, eatStartCondition4 } from './conditions/c4'
import { eatEndCondition5, eatStartCondition5 } from './conditions/c5'
import { eatStartCondition6 } from './conditions/c6'
import { eatStartCondition7 } from './conditions/c7'
import { HtmlBlockType } from './types'
import { eatHTMLTagName } from './util/eat-html-tagname'


/**
 * Params for constructing HtmlBlockTokenizer
 */
export interface HtmlBlockTokenizerProps {
  /**
   * YastNode types that can be interrupt by this BlockTokenizer.
   */
  readonly interruptableTypes?: YastNodeType[]
}


/**
 * Lexical Analyzer for HtmlBlock
 */
export class HtmlBlockTokenizer implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name = 'HtmlBlockTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly recognizedTypes: ReadonlyArray<T> = [HtmlBlockType]
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>


  public constructor(props: HtmlBlockTokenizerProps = {}) {
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
     * The opening tag can be indented 1-3 spaces, but not 4.
     * @see https://github.github.com/gfm/#example-152
     */
    if (eatingInfo.countOfPrecedeSpaces >= 4) return null

    const { startIndex, endIndex, firstNonWhitespaceIndex } = eatingInfo
    if (
      firstNonWhitespaceIndex >= endIndex ||
      nodePoints[firstNonWhitespaceIndex].codePoint !== AsciiCodePoint.OPEN_ANGLE
    ) return null

    const i = firstNonWhitespaceIndex + 1
    const startResult = this.eatStartCondition(nodePoints, i, endIndex)
    if (startResult == null) return null

    const { condition, nextIndex } = startResult
    const line: PhrasingContentLine = {
      nodePoints,
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
    }
    const state: MS = {
      type: HtmlBlockType,
      condition,
      lines: [line],
    }

    /**
     * The end tag can occur on the same line as the start tag.
     * @see https://github.github.com/gfm/#example-145
     * @see https://github.github.com/gfm/#example-146
     */
    if (condition !== 6 && condition !== 7) {
      const endResult = this.eatEndCondition(nodePoints, nextIndex, endIndex, condition)
      if (endResult != null) return { state, nextIndex: endIndex, saturated: true }
    }
    return { state, nextIndex: endIndex }
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatAndInterruptPreviousSibling(
    nodePoints: ReadonlyArray<NodePoint>,
    eatingInfo: EatingLineInfo,
  ): ResultOfEatAndInterruptPreviousSibling<T, MS> {
    const result = this.eatOpener(nodePoints, eatingInfo)
    if (result == null || result.state.condition === 7) return null
    return result
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
    const { startIndex, endIndex, firstNonWhitespaceIndex } = eatingInfo
    const nextIndex = this.eatEndCondition(
      nodePoints, firstNonWhitespaceIndex, endIndex, state.condition)

    if (nextIndex != -1) {
      const line: PhrasingContentLine = {
        nodePoints,
        startIndex,
        endIndex,
        firstNonWhitespaceIndex,
      }
      state.lines.push(line)
    }

    if (nextIndex === -1) return { status: 'notMatched', }
    if (nextIndex != null) return { status: 'closing', nextIndex: endIndex }
    return { status: 'opening', nextIndex: endIndex }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(
    nodePoints: ReadonlyArray<NodePoint>,
    postMatchState: Readonly<PMS>,
  ): ResultOfParse<T, PS> {
    let htmlType: PS['htmlType'] = 'raw'
    switch (postMatchState.condition) {
      case 2:
        htmlType = 'comment'
        break
      case 3:
        htmlType = 'instruction'
        break
      case 4:
        htmlType = 'declaration'
        break
      case 5:
        htmlType = 'cdata'
        break
      case 1:
      case 6:
      case 7:
        htmlType = 'raw'
        break
    }

    // Try to build phrasingContent
    const contents = mergeContentLinesFaithfully(postMatchState.lines)
    const state: PS = {
      type: HtmlBlockType,
      value: calcStringFromNodePoints(contents),
      htmlType,
    }
    return { classification: 'flow', state }
  }

  /**
   * Resolve html block start condition.
   *
   * @param nodePoints
   * @param startIndex
   * @param endIndex
   */
  protected eatStartCondition(
    nodePoints: ReadonlyArray<NodePoint>,
    startIndex: number,
    endIndex: number
  ): { condition: HtmlBlockConditionType, nextIndex: number } | null {
    let nextIndex: number | null = null
    if (startIndex >= endIndex) return null

    // condition 2
    nextIndex = eatStartCondition2(nodePoints, startIndex, endIndex)
    if (nextIndex != null) return { nextIndex, condition: 2 }

    // condition 3
    nextIndex = eatStartCondition3(nodePoints, startIndex, endIndex)
    if (nextIndex != null) return { nextIndex, condition: 3 }

    // condition 4
    nextIndex = eatStartCondition4(nodePoints, startIndex, endIndex)
    if (nextIndex != null) return { nextIndex, condition: 4 }

    // condition 5
    nextIndex = eatStartCondition5(nodePoints, startIndex, endIndex)
    if (nextIndex != null) return { nextIndex, condition: 5 }

    if (nodePoints[startIndex].codePoint !== AsciiCodePoint.SLASH) {
      const tagNameStartIndex = startIndex
      const tagNameEndIndex = eatHTMLTagName(nodePoints, tagNameStartIndex, endIndex)
      if (tagNameEndIndex == null) return null

      const tagNameInterval: NodeInterval = {
        startIndex: tagNameStartIndex,
        endIndex: tagNameEndIndex,
      }
      const rawTagName = calcStringFromNodePoints(
        nodePoints, tagNameInterval.startIndex, tagNameInterval.endIndex)
      const tagName = rawTagName.toLowerCase()

      // condition1
      nextIndex = eatStartCondition1(
        nodePoints, tagNameInterval.endIndex, endIndex, tagName)
      if (nextIndex != null) return { nextIndex, condition: 1 }

      // condition 6
      nextIndex = eatStartCondition6(
        nodePoints, tagNameInterval.endIndex, endIndex, tagName)
      if (nextIndex != null) return { nextIndex, condition: 6 }

      // condition 7
      nextIndex = eatStartCondition7(
        nodePoints, tagNameInterval.endIndex, endIndex, tagName, true)
      if (nextIndex != null) return { nextIndex, condition: 7 }

      // fallback
      return null
    }

    const tagNameStartIndex = startIndex + 1
    const tagNameEndIndex = eatHTMLTagName(nodePoints, tagNameStartIndex, endIndex)
    if (tagNameEndIndex == null) return null

    const tagNameInterval: NodeInterval = {
      startIndex: tagNameStartIndex,
      endIndex: tagNameEndIndex,
    }
    const rawTagName = calcStringFromNodePoints(
      nodePoints, tagNameInterval.startIndex, tagNameInterval.endIndex)
    const tagName = rawTagName.toLowerCase()

    // condition 6
    nextIndex = eatStartCondition6(
      nodePoints, tagNameInterval.endIndex, endIndex, tagName)
    if (nextIndex != null) return { nextIndex, condition: 6 }

    // condition 7.
    nextIndex = eatStartCondition7(
      nodePoints, tagNameInterval.endIndex, endIndex, tagName, false)
    if (nextIndex != null) return { nextIndex, condition: 7 }

    // fallback
    return null
  }

  /**
   * Resolve html block end condition.
   *
   * @param nodePoints
   * @param startIndex
   * @param endIndex
   * @param condition
   */
  protected eatEndCondition(
    nodePoints: ReadonlyArray<NodePoint>,
    startIndex: number,
    endIndex: number,
    condition: HtmlBlockConditionType,
  ): -1 | number | null {
    switch (condition) {
      case 1: {
        const nextIndex = eatEndCondition1(nodePoints, startIndex, endIndex)
        return nextIndex == null ? null : endIndex
      }
      case 2: {
        const nextIndex = eatEndCondition2(nodePoints, startIndex, endIndex)
        return nextIndex == null ? null : endIndex
      }
      case 3: {
        const nextIndex = eatEndCondition3(nodePoints, startIndex, endIndex)
        return nextIndex == null ? null : endIndex
      }
      case 4: {
        const nextIndex = eatEndCondition4(nodePoints, startIndex, endIndex)
        return nextIndex == null ? null : endIndex
      }
      case 5: {
        const nextIndex = eatEndCondition5(nodePoints, startIndex, endIndex)
        return nextIndex == null ? null : endIndex
      }
      case 6:
      case 7: {
        const firstNonWhitespaceIndex = eatOptionalWhitespaces(
          nodePoints, startIndex, endIndex)
        return firstNonWhitespaceIndex >= endIndex ? -1 : null
      }
    }
  }
}
