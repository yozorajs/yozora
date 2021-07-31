import { DefinitionType } from '@yozora/ast'
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
} from '@yozora/core-tokenizer'
import {
  BaseBlockTokenizer,
  TokenizerPriority,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
  eatOptionalWhitespaces,
  encodeLinkDestination,
  resolveLabelToIdentifier,
} from '@yozora/core-tokenizer'
import { uniqueName } from './types'
import type { Node, T, Token, TokenizerProps } from './types'
import { eatAndCollectLinkDestination } from './util/link-destination'
import { eatAndCollectLinkLabel } from './util/link-label'
import { eatAndCollectLinkTitle } from './util/link-title'

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
  extends BaseBlockTokenizer
  implements
    Tokenizer,
    TokenizerMatchBlockHook<T, Token>,
    TokenizerParseBlockHook<T, Token, Node>
{
  public override readonly isContainingBlock = false

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.ATOMIC,
    })
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatOpener(
    line: Readonly<PhrasingContentLine>,
  ): ResultOfEatOpener<T, Token> {
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
    const createInitState = (): Token => {
      const token: Token = {
        nodeType: DefinitionType,
        position: {
          start: calcStartYastNodePoint(nodePoints, startIndex),
          end: calcEndYastNodePoint(nodePoints, endIndex - 1),
        },
        label: linkLabelCollectResult.token,
        destination: null,
        title: null,
        lineNoOfLabel: lineNo,
        lineNoOfDestination: -1,
        lineNoOfTitle: -1,
        lines: [line],
      }
      return token
    }

    if (!linkLabelCollectResult.token.saturated) {
      const token = createInitState()
      return { token, nextIndex: endIndex }
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
      const token = createInitState()
      return { token, nextIndex: endIndex }
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
      !linkDestinationCollectResult.token.saturated &&
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
      const token = createInitState()
      token.destination = linkDestinationCollectResult.token
      token.lineNoOfDestination = lineNo
      return { token, nextIndex: endIndex }
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

    const token = createInitState()
    token.destination = linkDestinationCollectResult.token
    token.title = linkTitleCollectResult.token
    token.lineNoOfDestination = lineNo
    token.lineNoOfTitle = lineNo
    return { token, nextIndex: endIndex }
  }

  /**
   * @override
   * @see TokenizerMatchBlockHook
   */
  public eatContinuationText(
    line: Readonly<PhrasingContentLine>,
    token: Token,
  ): ResultOfEatContinuationText {
    // All parts of Definition have been matched
    if (token.title != null && token.title.saturated)
      return { status: 'notMatched' }

    const { nodePoints, startIndex, firstNonWhitespaceIndex, endIndex } = line
    const lineNo = nodePoints[startIndex].line

    let i = firstNonWhitespaceIndex
    if (!token.label.saturated) {
      const linkLabelCollectResult = eatAndCollectLinkLabel(
        nodePoints,
        i,
        endIndex,
        token.label,
      )
      if (linkLabelCollectResult.nextIndex < 0) {
        return { status: 'failedAndRollback', lines: token.lines }
      }

      const labelEndIndex = linkLabelCollectResult.nextIndex
      if (!linkLabelCollectResult.token.saturated) {
        token.lines.push(line)
        return { status: 'opening', nextIndex: endIndex }
      }

      // Saturated but no following colon exists.
      if (
        labelEndIndex + 1 >= endIndex ||
        nodePoints[labelEndIndex].codePoint !== AsciiCodePoint.COLON
      ) {
        return { status: 'failedAndRollback', lines: token.lines }
      }

      i = labelEndIndex + 1
    }

    if (token.destination == null) {
      i = eatOptionalWhitespaces(nodePoints, i, endIndex)
      if (i >= endIndex) {
        return { status: 'failedAndRollback', lines: token.lines }
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
        !linkDestinationCollectResult.token.saturated
      ) {
        return { status: 'failedAndRollback', lines: token.lines }
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
        token.destination = linkDestinationCollectResult.token
        token.lines.push(line)
        return { status: 'opening', nextIndex: endIndex }
      }

      // eslint-disable-next-line no-param-reassign
      token.lineNoOfDestination = lineNo
      // eslint-disable-next-line no-param-reassign
      token.lineNoOfTitle = lineNo
    }

    if (token.lineNoOfTitle < 0) {
      // eslint-disable-next-line no-param-reassign
      token.lineNoOfTitle = lineNo
    }

    const linkTitleCollectResult = eatAndCollectLinkTitle(
      nodePoints,
      i,
      endIndex,
      token.title,
    )
    // eslint-disable-next-line no-param-reassign
    token.title = linkTitleCollectResult.token

    if (
      linkTitleCollectResult.nextIndex < 0 ||
      linkTitleCollectResult.token.nodePoints.length <= 0 ||
      (linkTitleCollectResult.token.saturated &&
        eatOptionalWhitespaces(
          nodePoints,
          linkTitleCollectResult.nextIndex,
          endIndex,
        ) < endIndex)
    ) {
      // check if there exists a valid title
      if (token.lineNoOfDestination === token.lineNoOfTitle) {
        return { status: 'failedAndRollback', lines: token.lines }
      }

      const lastLine = token.lines[token.lines.length - 1]
      // eslint-disable-next-line no-param-reassign
      token.title = null
      // eslint-disable-next-line no-param-reassign
      token.position.end = calcEndYastNodePoint(
        lastLine.nodePoints,
        lastLine.endIndex - 1,
      )
      return {
        status: 'closingAndRollback',
        lines: token.lines.slice(token.lineNoOfTitle - 1),
      }
    }

    token.lines.push(line)
    const saturated: boolean = token.title?.saturated
    return { status: saturated ? 'closing' : 'opening', nextIndex: endIndex }
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public onClose(token: Token): ResultOfOnClose {
    // All parts of Definition have been matched.
    if (token.title != null && token.title.saturated) return

    // No valid label matched.
    if (!token.label.saturated) {
      return { status: 'failedAndRollback', lines: token.lines }
    }

    // No valid destination matched.
    if (token.destination == null || !token.destination.saturated) {
      return { status: 'failedAndRollback', lines: token.lines }
    }

    // No valid title matched.
    if (token.title != null && !token.title.saturated) {
      if (token.lineNoOfDestination === token.lineNoOfTitle) {
        return { status: 'failedAndRollback', lines: token.lines }
      }

      const lines = token.lines.splice(token.lineNoOfTitle - 1)
      const lastLine = token.lines[token.lines.length - 1]
      // eslint-disable-next-line no-param-reassign
      token.title = null
      // eslint-disable-next-line no-param-reassign
      token.position.end = calcEndYastNodePoint(
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
  public parseBlock(token: Readonly<Token>): ResultOfParse<T, Node> {
    /**
     * Labels are trimmed and case-insensitive
     * @see https://github.github.com/gfm/#example-174
     * @see https://github.github.com/gfm/#example-175
     */
    const labelPoints: NodePoint[] = token.label.nodePoints
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
    const destinationPoints: NodePoint[] = token.destination!.nodePoints
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
      token.title == null
        ? undefined
        : calcEscapedStringFromNodePoints(
            token.title.nodePoints,
            1,
            token.title.nodePoints.length - 1,
          )

    const node: Node = {
      type: DefinitionType,
      identifier,
      label,
      url,
      title,
    }
    return node
  }
}
