import type { YastNodeType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcEscapedStringFromNodePoints,
  calcStringFromNodePoints,
} from '@yozora/character'
import type {
  PhrasingContentLine,
  ResultOfEatContinuationText,
  ResultOfEatOpener,
  ResultOfOnClose,
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
  TokenizerParseMetaHook,
} from '@yozora/core-tokenizer'
import {
  calcEndYastNodePoint,
  calcStartYastNodePoint,
  eatOptionalWhitespaces,
  encodeLinkDestination,
} from '@yozora/core-tokenizer'
import type {
  DefinitionMetaData as MetaData,
  Definition as Node,
  DefinitionState as State,
  DefinitionType as T,
} from './types'
import { DefinitionType } from './types'
import { eatAndCollectLinkDestination } from './util/link-destination'
import {
  eatAndCollectLinkLabel,
  resolveLabelToIdentifier,
} from './util/link-label'
import { eatAndCollectLinkTitle } from './util/link-title'

/**
 * Params for constructing DefinitionTokenizer
 */
export interface DefinitionTokenizerProps {
  /**
   * Specify an array of YastNode types that can be interrupted by this
   * Tokenizer on match phase.
   */
  readonly interruptableTypes?: YastNodeType[]
}

/**
 * Lexical Analyzer for Definition.
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
 *
 * @see https://github.github.com/gfm/#link-reference-definition
 */
export class DefinitionTokenizer
  implements
    Tokenizer<T>,
    TokenizerMatchBlockHook<T, State>,
    TokenizerParseBlockHook<T, State, Node>,
    TokenizerParseMetaHook<Node, MetaData> {
  public readonly name: string = DefinitionTokenizer.name
  public readonly recognizedTypes: ReadonlyArray<T> = [DefinitionType]
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly isContainerBlock = false
  public readonly interruptableTypes: ReadonlyArray<YastNodeType>

  /* istanbul ignore next */
  constructor(props: DefinitionTokenizerProps = {}) {
    this.interruptableTypes = Array.isArray(props.interruptableTypes)
      ? [...props.interruptableTypes]
      : []
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatOpener(
    line: Readonly<PhrasingContentLine>,
  ): ResultOfEatOpener<T, State> {
    /**
     * Four spaces are too much
     * @see https://github.github.com/gfm/#example-180
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex >= endIndex) return null

    // Try to match link label
    let i = firstNonWhitespaceIndex
    const linkLabelCollectResult = eatAndCollectLinkLabel(
      nodePoints,
      i,
      endIndex,
      null,
    )
    if (linkLabelCollectResult.nextIndex < 0) return null

    const lineNo = nodePoints[startIndex].line

    // Optimization: lazy calculation
    const createInitState = (): State => {
      const state: State = {
        type: DefinitionType,
        position: {
          start: calcStartYastNodePoint(nodePoints, startIndex),
          end: calcEndYastNodePoint(nodePoints, endIndex - 1),
        },
        label: linkLabelCollectResult.state,
        destination: null,
        title: null,
        lineNoOfLabel: lineNo,
        lineNoOfDestination: -1,
        lineNoOfTitle: -1,
        lines: [{ ...line }],
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
    )
      return null

    /**
     * At most one line break can be used between link destination and link label
     * @see https://github.github.com/gfm/#example-162
     * @see https://github.github.com/gfm/#example-164
     * @see https://github.github.com/gfm/#link-reference-definition
     */
    i = eatOptionalWhitespaces(nodePoints, labelEndIndex + 1, endIndex)
    if (i >= endIndex) {
      const state = createInitState()
      return { state, nextIndex: endIndex }
    }

    // Try to match link destination
    const linkDestinationCollectResult = eatAndCollectLinkDestination(
      nodePoints,
      i,
      endIndex,
      null,
    )

    /**
     * The link destination may not be omitted
     * @see https://github.github.com/gfm/#example-168
     */
    if (linkDestinationCollectResult.nextIndex < 0) return null

    // Link destination not saturated
    if (
      !linkDestinationCollectResult.state.saturated &&
      linkDestinationCollectResult.nextIndex !== endIndex
    )
      return null

    /**
     * At most one line break can be used between link title and link destination
     * @see https://github.github.com/gfm/#example-162
     * @see https://github.github.com/gfm/#example-164
     * @see https://github.github.com/gfm/#link-reference-definition
     */
    const destinationEndIndex = linkDestinationCollectResult.nextIndex
    i = eatOptionalWhitespaces(nodePoints, destinationEndIndex, endIndex)
    if (i >= endIndex) {
      const state = createInitState()
      state.destination = linkDestinationCollectResult.state
      state.lineNoOfDestination = lineNo
      return { state, nextIndex: endIndex }
    }

    /**
     * The title must be separated from the link destination by whitespace.
     * @see https://github.github.com/gfm/#example-170
     */
    if (i === destinationEndIndex) return null

    // Try to match link-title
    const linkTitleCollectResult = eatAndCollectLinkTitle(
      nodePoints,
      i,
      endIndex,
      null,
    )

    /**
     * non-whitespace characters after title is not allowed
     * @see https://github.github.com/gfm/#example-178
     */
    if (linkTitleCollectResult.nextIndex >= 0) {
      i = linkTitleCollectResult.nextIndex
    }

    if (i < endIndex) {
      const k = eatOptionalWhitespaces(nodePoints, i, endIndex)
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
   * @see TokenizerMatchBlockHook
   */
  public eatContinuationText(
    line: Readonly<PhrasingContentLine>,
    state: State,
  ): ResultOfEatContinuationText {
    // All parts of Definition have been matched
    if (state.title != null && state.title.saturated)
      return { status: 'notMatched' }

    const { nodePoints, startIndex, firstNonWhitespaceIndex, endIndex } = line
    const lineNo = nodePoints[startIndex].line

    let i = firstNonWhitespaceIndex
    if (!state.label.saturated) {
      const linkLabelCollectResult = eatAndCollectLinkLabel(
        nodePoints,
        i,
        endIndex,
        state.label,
      )
      if (linkLabelCollectResult.nextIndex < 0) {
        return { status: 'failedAndRollback', lines: state.lines }
      }

      const labelEndIndex = linkLabelCollectResult.nextIndex
      if (!linkLabelCollectResult.state.saturated) {
        state.lines.push({ ...line })
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
      i = eatOptionalWhitespaces(nodePoints, i, endIndex)
      if (i >= endIndex) {
        return { status: 'failedAndRollback', lines: state.lines }
      }

      // Try to match link destination
      const linkDestinationCollectResult = eatAndCollectLinkDestination(
        nodePoints,
        i,
        endIndex,
        null,
      )

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
      i = eatOptionalWhitespaces(nodePoints, destinationEndIndex, endIndex)
      if (i >= endIndex) {
        // eslint-disable-next-line no-param-reassign
        state.destination = linkDestinationCollectResult.state
        state.lines.push({ ...line })
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

    const linkTitleCollectResult = eatAndCollectLinkTitle(
      nodePoints,
      i,
      endIndex,
      state.title,
    )
    // eslint-disable-next-line no-param-reassign
    state.title = linkTitleCollectResult.state

    if (
      linkTitleCollectResult.nextIndex < 0 ||
      linkTitleCollectResult.state.nodePoints.length <= 0 ||
      (linkTitleCollectResult.state.saturated &&
        eatOptionalWhitespaces(
          nodePoints,
          linkTitleCollectResult.nextIndex,
          endIndex,
        ) < endIndex)
    ) {
      // check if there exists a valid title
      if (state.lineNoOfDestination === state.lineNoOfTitle) {
        return { status: 'failedAndRollback', lines: state.lines }
      }

      const lines = state.lines.slice(state.lineNoOfTitle - 1)
      const lastLine = state.lines[state.lines.length - 1]
      // eslint-disable-next-line no-param-reassign
      state.title = null
      // eslint-disable-next-line no-param-reassign
      state.position.end = calcEndYastNodePoint(
        lastLine.nodePoints,
        lastLine.endIndex - 1,
      )

      return { status: 'closingAndRollback', lines }
    }

    state.lines.push({ ...line })
    const saturated: boolean = state.title?.saturated
    return { status: saturated ? 'closing' : 'opening', nextIndex: endIndex }
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public onClose(state: State): ResultOfOnClose {
    // All parts of Definition have been matched.
    if (state.title != null && state.title.saturated) return

    // No valid label matched.
    if (!state.label.saturated) {
      return { status: 'failedAndRollback', lines: state.lines }
    }

    // No valid destination matched.
    if (state.destination == null || !state.destination.saturated) {
      return { status: 'failedAndRollback', lines: state.lines }
    }

    // No valid title matched.
    if (state.title != null && !state.title.saturated) {
      if (state.lineNoOfDestination === state.lineNoOfTitle) {
        return { status: 'failedAndRollback', lines: state.lines }
      }

      const lines = state.lines.splice(state.lineNoOfTitle - 1)
      const lastLine = state.lines[state.lines.length - 1]
      // eslint-disable-next-line no-param-reassign
      state.title = null
      // eslint-disable-next-line no-param-reassign
      state.position.end = calcEndYastNodePoint(
        lastLine.nodePoints,
        lastLine.endIndex - 1,
      )

      return { status: 'closingAndRollback', lines }
    }
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parseBlock(state: Readonly<State>): ResultOfParse<Node> {
    /**
     * Labels are trimmed and case-insensitive
     * @see https://github.github.com/gfm/#example-174
     * @see https://github.github.com/gfm/#example-175
     */
    const labelPoints: NodePoint[] = state.label.nodePoints
    const label = calcStringFromNodePoints(
      labelPoints,
      1,
      labelPoints.length - 1,
    )
    const identifier = resolveLabelToIdentifier(label)

    /**
     * Resolve link destination
     * @see https://github.github.com/gfm/#link-destination
     */
    const destinationPoints: NodePoint[] = state.destination!.nodePoints
    const destination: string =
      destinationPoints[0].codePoint === AsciiCodePoint.OPEN_ANGLE
        ? calcEscapedStringFromNodePoints(
            destinationPoints,
            1,
            destinationPoints.length - 1,
            true,
          )
        : calcEscapedStringFromNodePoints(
            destinationPoints,
            0,
            destinationPoints.length,
            true,
          )
    const url = encodeLinkDestination(destination)

    /**
     * Resolve link title
     * @see https://github.github.com/gfm/#link-title
     */
    const title: string | undefined =
      state.title == null
        ? undefined
        : calcEscapedStringFromNodePoints(
            state.title.nodePoints,
            1,
            state.title.nodePoints.length - 1,
          )

    const node: Node = {
      type: state.type,
      identifier,
      label,
      url,
      title,
    }
    return { classification: 'flowAndMeta', node }
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parseMeta(Definitions: ReadonlyArray<Node>): MetaData {
    const metaData: MetaData = {}
    for (const Definition of Definitions) {
      const { identifier } = Definition

      /**
       * If there are several matching definitions, the first one takes precedence
       * @see https://github.github.com/gfm/#example-173
       */
      if (metaData[identifier] != null) continue

      const { label, url, title } = Definition
      metaData[identifier] = { identifier, label, url, title }
    }
    return metaData
  }
}
