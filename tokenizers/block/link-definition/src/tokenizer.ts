import { AsciiCodePoint } from '@yozora/character'
import {
  DataNodeTokenPointDetail,
  calcStringFromCodePoints,
  calcStringFromCodePointsIgnoreEscapes,
  eatAndCollectLinkDestination,
  eatAndCollectLinkTitle,
  eatLinkLabel,
  eatOptionalWhiteSpaces,
  resolveLabelToIdentifier,
} from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerEatContinuationResult,
  BlockTokenizerEatNewMarkerResult,
  BlockTokenizerEatingInfo,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreParsePhaseHook,
  PhrasingContentLine,
} from '@yozora/tokenizercore-block'
import {
  LinkDefinitionDataNodeType,
  LinkDefinitionMatchPhaseState,
  LinkDefinitionMetaData,
  LinkDefinitionPreMatchPhaseState,
} from './types'


type T = LinkDefinitionDataNodeType


/**
 * Lexical Analyzer for LinkDefinitionDataNode
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
export class LinkDefinitionTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPreMatchPhaseHook<
      T,
      LinkDefinitionPreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<
      T,
      LinkDefinitionPreMatchPhaseState,
      LinkDefinitionMatchPhaseState>,
    BlockTokenizerPreParsePhaseHook<
      T,
      LinkDefinitionMatchPhaseState,
      LinkDefinitionMetaData>
{
  public readonly name = 'LinkDefinitionTokenizer'
  public readonly uniqueTypes: T[] = [LinkDefinitionDataNodeType]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): BlockTokenizerEatNewMarkerResult<T, LinkDefinitionPreMatchPhaseState> {
    if (eatingInfo.isBlankLine) return null
    const { startIndex, firstNonWhiteSpaceIndex, endIndex, lineNo } = eatingInfo

    /**
     * Four spaces are too much
     * @see https://github.github.com/gfm/#example-180
     */
    if (firstNonWhiteSpaceIndex - startIndex >= 4) return null

    // Try to match link label
    let i = eatOptionalWhiteSpaces(
      codePositions, firstNonWhiteSpaceIndex, endIndex)
    const labelEndIndex = eatLinkLabel(codePositions, i, endIndex)
    if (
      labelEndIndex < 0 ||
      labelEndIndex + 1 >= endIndex ||
      codePositions[labelEndIndex].codePoint !== AsciiCodePoint.COLON
    ) {
      return null
    }

    // Optimization: lazy calculation
    const labelStartIndex = i
    const createInitState = () => {
      const line: PhrasingContentLine = {
        codePositions: codePositions.slice(startIndex, endIndex),
        firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
      }

      const label = codePositions.slice(labelStartIndex, labelEndIndex)
      const state: LinkDefinitionPreMatchPhaseState = {
        type: LinkDefinitionDataNodeType,
        parent: parentState,
        opening: true,
        label,
        destination: null,
        title: null,
        lineNoOfLabel: lineNo,
        lineNoOfDestination: -1,
        lineNoOfTitle: -1,
        lines: [line],
      }
      return state
    }

    /**
     * At most one line break can be used between link destination and link label
     * @see https://github.github.com/gfm/#example-162
     * @see https://github.github.com/gfm/#example-164
     * @see https://github.github.com/gfm/#link-reference-definition
     */
    i = eatOptionalWhiteSpaces(codePositions, labelEndIndex + 1, endIndex)
    if (i >= endIndex) {
      const state = createInitState()
      return { nextIndex: endIndex, state }
    }

    // Try to match link destination
    const linkDestinationCollectResult = eatAndCollectLinkDestination(
      codePositions, i, endIndex, null)

    /**
     * The link destination may not be omitted
     * @see https://github.github.com/gfm/#example-168
     */
    if (linkDestinationCollectResult.nextIndex < 0) {
      const k = eatOptionalWhiteSpaces(codePositions, i, endIndex)
      if (k < endIndex) return null
    }

    /**
     * Link destination cannot contain newline characters
     * @see https://github.github.com/gfm/#example-168
     */
    if (!linkDestinationCollectResult.state.saturated) {
      return null
    }

    /**
     * At most one line break can be used between link title and link destination
     * @see https://github.github.com/gfm/#example-162
     * @see https://github.github.com/gfm/#example-164
     * @see https://github.github.com/gfm/#link-reference-definition
     */
    const destinationEndIndex = linkDestinationCollectResult.nextIndex
    i = eatOptionalWhiteSpaces(codePositions, destinationEndIndex, endIndex)
    if (i >= endIndex) {
      const state = createInitState()
      state.destination = linkDestinationCollectResult.state.codePositions
      state.lineNoOfDestination = lineNo
      return { nextIndex: endIndex, state }
    }

    // Try to match link-title
    const linkTitleCollectResult = eatAndCollectLinkTitle(
      codePositions, i, endIndex, null)

    /**
     * non-whitespace characters after title is not allowed
     * @see https://github.github.com/gfm/#example-178
     */
    if (linkTitleCollectResult.state.saturated) {
      i = linkTitleCollectResult.nextIndex
    }
    if (i < endIndex) {
      const k = eatOptionalWhiteSpaces(codePositions, i, endIndex)
      if (k < endIndex) return null
    }

    const state = createInitState()
    state.destination = linkDestinationCollectResult.state.codePositions
    state.title = linkTitleCollectResult.state
    state.lineNoOfDestination = lineNo
    state.lineNoOfTitle = lineNo
    return { nextIndex: endIndex, state }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: LinkDefinitionPreMatchPhaseState,
  ): BlockTokenizerEatContinuationResult {
    // All parts of LinkDefinition have been matched
    if (state.title != null && state.title.saturated) return null

    const { startIndex, firstNonWhiteSpaceIndex, endIndex, lineNo } = eatingInfo

    // Create state when this line is a valid part of the LinkDefinition
    const createSucceedState = (saturated: boolean): BlockTokenizerEatContinuationResult => {
      return {
        resultType: 'continue',
        nextIndex: endIndex,
        saturated,
      }
    }

    // Create state when the LinkDefinition matching failed
    const createFailedState = (lineStart: number): BlockTokenizerEatContinuationResult => {
      return {
        resultType: 'replace',
        nextIndex: startIndex,
        opening: true,
        lines: lineStart === 0 ? state.lines : state.lines.slice(lineStart),
      }
    }

    let i = firstNonWhiteSpaceIndex
    if (state.destination == null) {
      i = eatOptionalWhiteSpaces(codePositions, firstNonWhiteSpaceIndex, endIndex)
      if (i >= endIndex) return createFailedState(0)

      // Try to match link destination
      const linkDestinationCollectResult = eatAndCollectLinkDestination(
        codePositions, i, endIndex, null)

      /**
       * At most one line break can be used between link destination and link label,
       * therefore, this line must match a complete link destination
       */
      if (
        linkDestinationCollectResult.nextIndex < 0 ||
        linkDestinationCollectResult.state.saturated
      ) return createFailedState(0)

      /**
       * At most one line break can be used between link title and link destination
       * @see https://github.github.com/gfm/#example-162
       * @see https://github.github.com/gfm/#example-164
       * @see https://github.github.com/gfm/#link-reference-definition
       */
      const destinationEndIndex = linkDestinationCollectResult.nextIndex
      i = eatOptionalWhiteSpaces(codePositions, destinationEndIndex, endIndex)
      if (i >= endIndex) {
        // eslint-disable-next-line no-param-reassign
        state.destination = linkDestinationCollectResult.state.codePositions
        return createSucceedState(false)
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

    const linkTitleCollectResult = eatAndCollectLinkTitle(
      codePositions, i, endIndex, state.title)
    // eslint-disable-next-line no-param-reassign
    state.title = linkTitleCollectResult.state

    if (
      linkTitleCollectResult.nextIndex < 0 ||
      linkTitleCollectResult.state.codePositions.length <= 0 ||
      (
        linkTitleCollectResult.state.saturated &&
        eatOptionalWhiteSpaces(codePositions, linkTitleCollectResult.nextIndex, endIndex) < endIndex
      )
    ) {
      if (state.lineNoOfDestination === state.lineNoOfTitle) return createFailedState(0)

      // TODO: Also return the valid matched part of LinkDestination
      if (state.lineNoOfLabel === state.lineNoOfDestination) return createFailedState(1)
      return createFailedState(2)
    }

    return createSucceedState(state.title.saturated)
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: LinkDefinitionPreMatchPhaseState,
  ): LinkDefinitionMatchPhaseState {
    const title: DataNodeTokenPointDetail[] = preMatchPhaseState.title != null
      ? preMatchPhaseState.title.codePositions
      : []

    const result: LinkDefinitionMatchPhaseState  = {
      type: preMatchPhaseState.type,
      classify: 'meta',
      label: preMatchPhaseState.label,
      destination: preMatchPhaseState.destination!,
      title,
    }
    return result
  }

  /**
   * hook of @BlockTokenizerPreParsePhaseHook
   */
  public parseMeta(
    matchPhaseStates: LinkDefinitionMatchPhaseState[]
  ): LinkDefinitionMetaData {
    const metaData: LinkDefinitionMetaData = {}
    for (const matchPhaseState of matchPhaseStates) {
      /**
       * Labels are trimmed and case-insensitive
       * @see https://github.github.com/gfm/#example-174
       * @see https://github.github.com/gfm/#example-175
       */
      const label = calcStringFromCodePoints(
        matchPhaseState.label, 1, matchPhaseState.label.length - 1)
      const identifier = resolveLabelToIdentifier(label)

      /**
       * If there are several matching definitions, the first one takes precedence
       * @see https://github.github.com/gfm/#example-173
       */
      if (metaData[identifier] != null) continue

      let destination: string
      if (matchPhaseState.destination[0].codePoint === AsciiCodePoint.OPEN_ANGLE) {
        destination = calcStringFromCodePointsIgnoreEscapes(
          matchPhaseState.destination, 1, matchPhaseState.destination.length - 1)
      } else {
        destination = calcStringFromCodePointsIgnoreEscapes(
          matchPhaseState.destination, 0, matchPhaseState.destination.length)
      }

      metaData[identifier] = {
        type: LinkDefinitionDataNodeType,
        identifier,
        label,
        destination,
      }

      // title are optional
      if (matchPhaseState.title != null) {
        const title = calcStringFromCodePointsIgnoreEscapes(
          matchPhaseState.title, 1, matchPhaseState.title.length - 1)
        metaData[identifier].title = title
      }
    }
    return metaData
  }
}
