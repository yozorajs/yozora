import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  EatingLineInfo,
  PhrasingContentLine,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfParse,
  YastBlockNodeType,
} from '@yozora/tokenizercore-block'
import type {
  LinkDefinition as PS,
  LinkDefinitionMatchPhaseState as MS,
  LinkDefinitionMetaData as MetaData,
  LinkDefinitionPostMatchPhaseState as PMS,
  LinkDefinitionType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import {
  calcStringFromNodePoints,
  calcStringFromNodePointsIgnoreEscapes,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizercore'
import { LinkDefinitionType } from './types'
import { eatAndCollectLinkDestination } from './util/link-destination'
import {
  eatAndCollectLinkLabel,
  resolveLabelToIdentifier,
} from './util/link-label'
import { eatAndCollectLinkTitle } from './util/link-title'


/**
 * Params for constructing LinkDefinitionTokenizer
 */
export interface LinkDefinitionTokenizerProps {
  /**
   * YastNode types that can be interrupt by this BlockTokenizer.
   */
  readonly interruptableTypes?: YastBlockNodeType[]
}


/**
 * Lexical Analyzer for LinkDefinition
 *
 * A link reference definition consists of a link label, indented up to three
 * spaces, followed by a colon (:), optional whitespace (including up to one
 * line ending), a link destination, optional whitespace (including up to one
 * line ending), and an optional link title, which if it is present must be
 * separated from the link destination by whitespace. No further non-whitespace
 * characters may occur on the line.
 *
 * A link reference definition does not correspond to a structural element of
 * a document. Instead, it defines a label which can be used in reference
 * links and reference-style images elsewhere in the document. Link reference
 * definitions can come either before or after the links that use them.
 * @see https://github.github.com/gfm/#link-reference-definition
 */
export class LinkDefinitionTokenizer implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, PS, MetaData>
{
  public readonly name = 'LinkDefinitionTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly recognizedTypes: ReadonlyArray<T> = [LinkDefinitionType]
  public readonly interruptableTypes: ReadonlyArray<YastBlockNodeType>

  public constructor(props: LinkDefinitionTokenizerProps = {}) {
    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : []
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatOpener(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
  ): ResultOfEatOpener<T, MS> {
    const { startIndex, firstNonWhitespaceIndex, endIndex } = eatingInfo

    /**
     * Four spaces are too much
     * @see https://github.github.com/gfm/#example-180
     */
    if (
      firstNonWhitespaceIndex >= endIndex ||
      firstNonWhitespaceIndex - startIndex >= 4
    ) return null

    // Try to match link label
    let i = eatOptionalWhiteSpaces(nodePoints, firstNonWhitespaceIndex, endIndex)
    const linkLabelCollectResult = eatAndCollectLinkLabel(nodePoints, i, endIndex, null)

    // no valid link-label matched
    if (linkLabelCollectResult.nextIndex < 0) return null

    const lineNo = nodePoints[startIndex].line

    // Optimization: lazy calculation
    const createInitState = () => {
      const line: PhrasingContentLine = {
        nodePoints,
        startIndex,
        endIndex,
        firstNonWhitespaceIndex,
      }
      const state: MS = {
        type: LinkDefinitionType,
        label: linkLabelCollectResult.state,
        destination: null,
        title: null,
        lineNoOfLabel: lineNo,
        lineNoOfDestination: -1,
        lineNoOfTitle: -1,
        lines: [line],
      }
      return state
    }

    if (!linkLabelCollectResult.state.saturated) {
      const state = createInitState()
      return { state, nextIndex: endIndex }
    }

    // Saturated but no following colon exists.
    const labelEndIndex = linkLabelCollectResult.nextIndex
    if (
      labelEndIndex < 0 ||
      labelEndIndex + 1 >= endIndex ||
      nodePoints[labelEndIndex].codePoint !== AsciiCodePoint.COLON
    ) {
      return null
    }

    /**
     * At most one line break can be used between link destination and link label
     * @see https://github.github.com/gfm/#example-162
     * @see https://github.github.com/gfm/#example-164
     * @see https://github.github.com/gfm/#link-reference-definition
     */
    i = eatOptionalWhiteSpaces(nodePoints, labelEndIndex + 1, endIndex)
    if (i >= endIndex) {
      const state = createInitState()
      return { state, nextIndex: endIndex }
    }

    // Try to match link destination
    const linkDestinationCollectResult =
      eatAndCollectLinkDestination(nodePoints, i, endIndex, null)

    /**
     * The link destination may not be omitted
     * @see https://github.github.com/gfm/#example-168
     */
    if (linkDestinationCollectResult.nextIndex < 0) return null

    // Link destination not saturated
    if (
      !linkDestinationCollectResult.state.saturated &&
      linkDestinationCollectResult.nextIndex !== endIndex
    ) return null

    /**
     * At most one line break can be used between link title and link destination
     * @see https://github.github.com/gfm/#example-162
     * @see https://github.github.com/gfm/#example-164
     * @see https://github.github.com/gfm/#link-reference-definition
     */
    const destinationEndIndex = linkDestinationCollectResult.nextIndex
    i = eatOptionalWhiteSpaces(nodePoints, destinationEndIndex, endIndex)
    if (i >= endIndex) {
      const state = createInitState()
      state.destination = linkDestinationCollectResult.state
      state.lineNoOfDestination = lineNo
      return { state, nextIndex: endIndex }
    }

    // Try to match link-title
    const linkTitleCollectResult =
      eatAndCollectLinkTitle(nodePoints, i, endIndex, null)

    /**
     * non-whitespace characters after title is not allowed
     * @see https://github.github.com/gfm/#example-178
     */
    if (linkTitleCollectResult.nextIndex >= 0) {
      i = linkTitleCollectResult.nextIndex
    }

    if (i < endIndex) {
      const k = eatOptionalWhiteSpaces(nodePoints, i, endIndex)
      if (k < endIndex) return null
    }

    const state = createInitState()
    state.destination = linkDestinationCollectResult.state
    state.title = linkTitleCollectResult.state
    state.lineNoOfDestination = lineNo
    state.lineNoOfTitle = lineNo
    return { state, nextIndex: endIndex }
  }

  /**
   * @override
   * @see BlockTokenizerMatchPhaseHook
   */
  public eatContinuationText(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
  ): ResultOfEatContinuationText {
    // All parts of LinkDefinition have been matched
    if (state.title != null && state.title.saturated) {
      return { status: 'notMatched' }
    }

    const { startIndex, firstNonWhitespaceIndex, endIndex} = eatingInfo
    const lineNo = nodePoints[startIndex].line

    let i = firstNonWhitespaceIndex
    if (!state.label.saturated) {
      const linkLabelCollectResult =
        eatAndCollectLinkLabel(nodePoints, i, endIndex, state.label)
      if (linkLabelCollectResult.nextIndex < 0) {
        return { status: 'failedAndRollback', lines: state.lines }
      }

      const labelEndIndex = linkLabelCollectResult.nextIndex
      if (!linkLabelCollectResult.state.saturated) {
        return { status: 'opening', nextIndex: endIndex }
      }

      // Saturated but no following colon exists.
      if (
        labelEndIndex + 1 >= endIndex ||
        nodePoints[labelEndIndex].codePoint !== AsciiCodePoint.COLON
      ) {
        return { status: 'failedAndRollback', lines: state.lines }
      }

      i = labelEndIndex + 1
    }

    if (state.destination == null) {
      i = eatOptionalWhiteSpaces(nodePoints, i, endIndex)
      if (i >= endIndex) {
        return { status: 'failedAndRollback', lines: state.lines }
      }

      // Try to match link destination
      const linkDestinationCollectResult =
        eatAndCollectLinkDestination(nodePoints, i, endIndex, null)

      /**
       * At most one line break can be used between link destination and link label,
       * therefore, this line must match a complete link destination
       */
      if (
        linkDestinationCollectResult.nextIndex < 0 ||
        !linkDestinationCollectResult.state.saturated
      ) {
        return { status: 'failedAndRollback', lines: state.lines }
      }

      /**
       * At most one line break can be used between link title and link destination
       * @see https://github.github.com/gfm/#example-162
       * @see https://github.github.com/gfm/#example-164
       * @see https://github.github.com/gfm/#link-reference-definition
       */
      const destinationEndIndex = linkDestinationCollectResult.nextIndex
      i = eatOptionalWhiteSpaces(nodePoints, destinationEndIndex, endIndex)
      if (i >= endIndex) {
        // eslint-disable-next-line no-param-reassign
        state.destination = linkDestinationCollectResult.state
        return { status: 'opening', nextIndex: endIndex }
      }

      // eslint-disable-next-line no-param-reassign
      state.lineNoOfDestination = lineNo
      // eslint-disable-next-line no-param-reassign
      state.lineNoOfTitle = lineNo
    }

    if (state.lineNoOfTitle < 0) {
      // eslint-disable-next-line no-param-reassign
      state.lineNoOfTitle = lineNo
    }

    const linkTitleCollectResult =
      eatAndCollectLinkTitle(nodePoints, i, endIndex, state.title)
    // eslint-disable-next-line no-param-reassign
    state.title = linkTitleCollectResult.state

    if (
      linkTitleCollectResult.nextIndex < 0 ||
      linkTitleCollectResult.state.nodePoints.length <= 0 ||
      (
        linkTitleCollectResult.state.saturated &&
        eatOptionalWhiteSpaces(
          nodePoints, linkTitleCollectResult.nextIndex, endIndex) < endIndex
      )
    ) {
      // check if there exists a valid title
      if (state.lineNoOfDestination === state.lineNoOfTitle) {
        return { status: 'failedAndRollback', lines: state.lines }
      }

      // eslint-disable-next-line no-param-reassign
      state.title = null

      return {
        status: 'closingAndRollback',
        lines: state.lines.slice(state.lineNoOfTitle),
      }
    }

    const saturated: boolean = state.title?.saturated
    const line: PhrasingContentLine = {
      nodePoints,
      startIndex,
      endIndex,
      firstNonWhitespaceIndex,
    }
    state.lines.push(line)
    return { status: saturated ? 'closing' : 'opening', nextIndex: endIndex }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public onClose(state: MS): void {
    // TODO check if state is well saturated.

  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    postMatchState: Readonly<PMS>,
  ): ResultOfParse<T, PS> {
    /**
     * Labels are trimmed and case-insensitive
     * @see https://github.github.com/gfm/#example-174
     * @see https://github.github.com/gfm/#example-175
     */
    const labelPoints: EnhancedYastNodePoint[] = postMatchState.label.nodePoints
    const label = calcStringFromNodePoints(labelPoints, 1, labelPoints.length - 1)
    const identifier = resolveLabelToIdentifier(label)

    /**
     * Resolve link destination
     * @see https://github.github.com/gfm/#link-destination
     */
    const destinationPoints: EnhancedYastNodePoint[] =
      postMatchState.destination!.nodePoints
    const destination: string =
      destinationPoints[0].codePoint === AsciiCodePoint.OPEN_ANGLE
        ? calcStringFromNodePointsIgnoreEscapes(
          destinationPoints, 1, destinationPoints.length - 1)
        : calcStringFromNodePointsIgnoreEscapes(
          destinationPoints, 0, destinationPoints.length)

    /**
     * Resolve link title
     * @see https://github.github.com/gfm/#link-title
     */
    const title: string | undefined = postMatchState.title == null
      ? undefined
      : calcStringFromNodePointsIgnoreEscapes(
        postMatchState.title.nodePoints,
        1,
        postMatchState.title.nodePoints.length - 1
      )

    const state: PS = {
      type: postMatchState.type,
      identifier,
      label,
      destination,
      title,
    }
    return { classification: 'meta', state }
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parseMeta(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    linkDefinitions: ReadonlyArray<PS>
  ): MetaData {
    const metaData: MetaData = {}
    for (const linkDefinition of linkDefinitions) {
      const { identifier } = linkDefinition

      /**
       * If there are several matching definitions, the first one takes precedence
       * @see https://github.github.com/gfm/#example-173
       */
      if (metaData[identifier] != null) continue

      metaData[identifier] = linkDefinition
    }
    return metaData
  }
}
